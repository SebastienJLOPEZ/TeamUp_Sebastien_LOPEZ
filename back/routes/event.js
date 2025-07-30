require('dotenv').config();

const express = require('express');
const axios = require('axios');
const Event = require('../models/Event');
const router = express.Router();

// Service pour enrichir les événements avec les données du centre
const enrichEventWithCenterData = async (event) => {
    try {
        // Si les données du centre sont fraîches, les utiliser
        if (event.isCenterDataFresh()) {
            return event;
        }

        // Sinon, récupérer les données depuis l'API
        const response = await axios.get(`${process.env.API_BASE_URL}`, {
            params: {
                dataset: 'data-es',
                recordid: event.centerId
            },
            timeout: 5000
        });

        if (response.data.record) {
            const record = response.data.record;
            event.centerData = {
                name: record.fields.ins_nom || 'Centre sportif',
                address: record.fields.ins_adresse || '',
                city: record.fields.com_nom || '',
                zipCode: record.fields.ins_cp || '',
                coordinates: {
                    lat: record.fields.coordonnees ? record.fields.coordonnees[0] : null,
                    lng: record.fields.coordonnees ? record.fields.coordonnees[1] : null
                },
                equipments: record.fields.famille_activite || [],
                lastUpdated: new Date()
            };

            // Sauvegarder le cache
            await event.save();
        }
    } catch (error) {
        console.error('Erreur lors de l\'enrichissement des données du centre:', error.message);
        // Continuer avec les données existantes si l'API est indisponible
    }

    return event;
};

/**
 * Créer un nouvel événement
 */
router.post('/add', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const {
            title,
            description,
            sport,
            date,
            startTime,
            endTime,
            maxParticipants,
            centerId
        } = req.body;

        // Validation des données requises
        if (!title || !sport || !date || !startTime || !endTime || !maxParticipants || !centerId) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs obligatoires doivent être renseignés'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const creator = decoded.userId;

        // Vérifier que le centre sportif existe
        try {
            const centerResponse = await axios.get(`${process.env.API_BASE_URL}`, {
                params: {
                    dataset: 'data-es',
                    recordid: centerId
                },
                timeout: 5000
            });

            if (!centerResponse.data.record) {
                return res.status(404).json({
                    success: false,
                    message: 'Centre sportif non trouvé'
                });
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du centre:', error.message);
            // Continuer la création même si l'API est indisponible
        }

        const event = new Event({
            title,
            description,
            sport,
            date: new Date(date),
            startTime,
            endTime,
            maxParticipants,
            creator,
            participants: [],
            centerId,
            status: 'active',
        });

        const savedEvent = await event.save();

        // Enrichir avec les données du centre
        const enrichedEvent = await enrichEventWithCenterData(savedEvent);

        res.status(201).json({
            success: true,
            data: enrichedEvent
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        console.error('Erreur lors de la création de l\'événement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'événement',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Obtenir les événements d'un utilisateur (créés + rejoints)
 */
router.get('/user/creator', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const { page = 1, limit = 10, status = 'active' } = req.query;

        const skip = (page - 1) * limit;

        // Rechercher les événements où l'utilisateur est créateur ou participant
        const events = await Event.find({
            creator: userId,
        })
        .populate('participants', 'name surname')
        .sort({ date: 1, startTime: 1, endTime: 1 })
        .skip(skip)
        .limit(parseInt(limit));


        // Enrichir avec les données des centres
        const enrichedEvents = await Promise.all(
            events.map(async event => {
                const eventObject = event.toObject();
                delete eventObject.creator;
                return await enrichEventWithCenterData(eventObject);
            })
        );

        const total = await Event.countDocuments({
            creator: userId
        });

        res.json({
            success: true,
            data: enrichedEvents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        console.error('Erreur lors de la récupération des événements:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des événements'
        });
    }
});

router.get('/user/participant', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const { page = 1, limit = 10, status = 'active' } = req.query;

        const skip = (page - 1) * limit;

        // Rechercher les événements où l'utilisateur est créateur ou participant
        const events = await Event.find({
            participants: userId
        })
        .populate('participants', 'name surname')
        .sort({ date: 1, startTime: 1, endTime: 1 })
        .skip(skip)
        .limit(parseInt(limit));

        // Enrichir avec les données des centres
        const enrichedEvents = await Promise.all(
            events.map(async event => {
                const eventObject = event.toObject();
                delete eventObject.participants;
                return await enrichEventWithCenterData(eventObject);
            })
        );

        const total = await Event.countDocuments({
            participants: userId,
            date: { $gte: new Date() }
        });

        res.json({
            success: true,
            data: enrichedEvents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        console.error('Erreur lors de la récupération des événements:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des événements'
        });
    }
});

/**
 * Obtenir les événements publics (pour découvrir de nouveaux événements)
 */
router.get('/public', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sport = '',
            city = '',
            date = '',
            lat = '',
            lng = '',
            radius = 10
        } = req.query;

        const skip = (page - 1) * limit;

        // Construire les filtres
        let filters = {
            status: 'active',
            date: { $gte: new Date() },
            $expr: { $lt: ['$currentParticipants', '$maxParticipants'] } // Places disponibles
        };

        if (sport) filters.sport = new RegExp(sport, 'i');
        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);
            filters.date = { $gte: searchDate, $lt: nextDay };
        }

        let query = Event.find(filters)
            .populate('creator', 'name email')
            .sort({ date: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const events = await query;

        // Enrichir avec les données des centres
        let enrichedEvents = await Promise.all(
            events.map(event => enrichEventWithCenterData(event))
        );

        // Filtrer par ville si spécifiée
        if (city) {
            enrichedEvents = enrichedEvents.filter(event =>
                event.centerData &&
                event.centerData.city &&
                event.centerData.city.toLowerCase().includes(city.toLowerCase())
            );
        }

        // Filtrer par géolocalisation si spécifiée
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);
            const radiusKm = parseInt(radius);

            enrichedEvents = enrichedEvents.filter(event => {
                if (!event.centerData || !event.centerData.coordinates) return false;

                const distance = calculateDistance(
                    userLat, userLng,
                    event.centerData.coordinates.lat,
                    event.centerData.coordinates.lng
                );

                return distance <= radiusKm;
            });
        }

        const total = await Event.countDocuments(filters);

        res.json({
            success: true,
            data: enrichedEvents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des événements publics:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des événements publics'
        });
    }
});

/**
 * Rejoindre un événement
 */
router.post('/:id/join', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const { id } = req.params;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        // Vérifier si l'utilisateur n'est pas déjà participant
        if (event.participants.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Vous participez déjà à cet événement'
            });
        }

        // Vérifier s'il y a encore des places
        if (event.currentParticipants >= event.maxParticipants) {
            return res.status(400).json({
                success: false,
                message: 'Événement complet'
            });
        }

        // Ajouter l'utilisateur
        event.participants.push(userId);
        event.currentParticipants += 1;

        await event.save();

        const enrichedEvent = await enrichEventWithCenterData(event);

        res.json({
            success: true,
            data: enrichedEvent
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        console.error('Erreur lors de la participation à l\'événement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la participation à l\'événement'
        });
    }
});

/**
 * Quitter un événement
 */
router.post('/:id/leave', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const { id } = req.params;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        // Vérifier si l'utilisateur est bien participant
        if (!event.participants.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Vous ne participez pas à cet événement'
            });
        }

        // Le créateur ne peut pas quitter son propre événement
        if (event.creator.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Le créateur ne peut pas quitter son propre événement'
            });
        }

        // Retirer l'utilisateur
        event.participants = event.participants.filter(p => p.toString() !== userId);
        event.currentParticipants -= 1;

        await event.save();

        const enrichedEvent = await enrichEventWithCenterData(event);

        res.json({
            success: true,
            data: enrichedEvent
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        console.error('Erreur lors de la sortie de l\'événement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la sortie de l\'événement'
        });
    }
});

router.put('/:id/update', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const { id } = req.params;
        const {
            status,
            startTime,
            endTime,
            date,
            centerId
        } = req.body;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        // Mettre à jour les champs si fournis
        if (status) event.status = status;
        if (startTime) event.startTime = startTime;
        if (endTime) event.endTime = endTime;
        if (date) event.date = new Date(date);
        if (centerId && centerId !== event.centerId) {
            event.centerId = centerId;
            event.centerData = undefined; // Réinitialiser les données du centre pour rafraîchir
        }

        await event.save();

        // Enrichir avec les nouvelles données du centre si nécessaire
        const enrichedEvent = await enrichEventWithCenterData(event);

        res.json({
            success: true,
            data: enrichedEvent
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        console.error('Erreur lors de la mise à jour de l\'événement:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'événement'
        });
    }
});

// N'est appelé que pour rendre un évènement "terminé"
router.put('/:id/finish', async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }

        event.status = "completed";
        await event.save();

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Erreur lors du changement de status:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du changement de status'
        });
    }
});


// Fonction utilitaire pour calculer la distance entre deux points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

module.exports = router;