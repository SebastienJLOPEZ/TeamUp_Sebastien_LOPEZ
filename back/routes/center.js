require('dotenv').config();

const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const router = express.Router();

// Cache pour 6 heures (les données des centres changent rarement)
const centerCache = new NodeCache({ stdTTL: 6 * 60 * 60 });

// URL de l'API gouvernementale
const API_BASE_URL = process.env.API_BASE_URL;

/**
 * Rechercher des centres sportifs par critères
 */
router.get('/search', async (req, res) => {
    try {
        const {
            q = '',
            city = '',
            sport = '',
            lat = '',
            lng = '',
            radius = 10,
            limit = 20
        } = req.query;

        // Clé de cache basée sur les paramètres
        const cacheKey = `search_${JSON.stringify(req.query)}`;
        const cachedResult = centerCache.get(cacheKey);

        if (cachedResult) {
            return res.json({
                success: true,
                data: cachedResult,
                cached: true
            });
        }

        // Construction de la requête
        let params = {
            dataset: 'data-es',
            rows: limit,
            facet: ['famille_activite', 'com_nom', 'dep_nom']
        };

        // Filtres
        let filters = [];
        if (city) filters.push(`com_nom:"${city}"`);
        if (sport) filters.push(`famille_activite:"${sport}"`);
        if (q) params.q = q;
        if (whereClause.length > 0) {
            params.where = whereClause.join(' AND ');
        }

        // Géolocalisation
        if (lat && lng) {
            params.geofilter = `distance(equip_coordonnees,${lat},${lng},${radius}km)`;
        }

        const response = await axios.get(`${API_BASE_URL}/api/explore/v2.1/catalog/datasets/data-es/records`, {
            params,
            timeout: 10000
        });

        const canBeReserved = (record) => {
            if (!record.fields.equip_ouv_public_bool) return false;
            // Ajouter d'autres conditions si nécessaire
            return true;
        };

        const hasAvailableEquipments = (record) => {
            const hasStorageRoom = record.fields.equip_loc_type?.includes("Local de rangement");
            const hasClubManagement = record.fields.equip_loc_type?.includes("Club");
            const hasClubOffice = record.fields.equip_loc_type?.includes("Bureau(x) de club");
            return hasStorageRoom || hasClubManagement || hasClubOffice;
        }

        const formattedData = response.data.records.map(record => ({
            id: record.fields.equip_numero,
            name: record.fields.equip_nom || record.fields.inst_nom || 'Installation sportive',
            address: record.fields.inst_adresse || '',
            city: record.fields.new_name || '',
            zipCode: record.fields.inst_cp || '',
            depCode: record.fields.dep_code || '',
            regCode: record.fields.reg_code || '',
            coordinates: {
                lat: record.fields.equip_coordonnees?.lat || null,
                lng: record.fields.equip_coordonnees?.lon || null
            },
            hasEquipments: Boolean(hasAvailableEquipments(record)),
            type: record.fields.equip_type_name || '',
        }));

        // Mise en cache
        centerCache.set(cacheKey, formattedData);

        res.json({
            success: true,
            data: formattedData,
            total: response.data.nhits,
            cached: false
        });

    } catch (error) {
        console.error('Erreur lors de la recherche des centres:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche des centres sportifs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Obtenir les détails d'un centre par ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier le cache
        const cacheKey = `center_${id}`;
        const cachedCenter = centerCache.get(cacheKey);

        if (cachedCenter) {
            return res.json({
                success: true,
                data: cachedCenter,
                cached: true
            });
        }

        const response = await axios.get(`${API_BASE_URL}/api/explore/v2.1/catalog/datasets/data-es/records`, {
            params: { recordid: id },
            timeout: 10000
        });

        if (!response.data.record) {
            return res.status(404).json({
                success: false,
                message: 'Centre sportif non trouvé'
            });
        }

        const record = response.data.record;
        const centerData = {
            id: record.recordid,
            name: record.fields.ins_nom || 'Centre sportif',
            address: record.fields.ins_adresse || '',
            city: record.fields.com_nom || '',
            zipCode: record.fields.ins_cp || '',
            coordinates: {
                lat: record.fields.coordonnees ? record.fields.coordonnees[0] : null,
                lng: record.fields.coordonnees ? record.fields.coordonnees[1] : null
            },
            equipments: record.fields.famille_activite || [],
            phone: record.fields.ins_telephone || '',
            website: record.fields.ins_siteweb || '',
            accessibility: record.fields.ins_accessibilite_handicap || false
        };

        // Mise en cache
        centerCache.set(cacheKey, centerData);

        res.json({
            success: true,
            data: centerData,
            cached: false
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du centre:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du centre sportif',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Obtenir les centres populaires (les plus utilisés dans les événements)
 */
// router.get('/popular', async (req, res) => {
//     try {
//         const Event = require('../models/Event');

//         // Agrégation pour trouver les centres les plus populaires
//         const popularCenters = await Event.aggregate([
//             { $match: { status: 'active' } },
//             { $group: { _id: '$centerId', count: { $sum: 1 } } },
//             { $sort: { count: -1 } },
//             { $limit: 10 }
//         ]);

//         const centersData = [];
//         for (const center of popularCenters) {
//             try {
//                 const response = await axios.get(`${API_BASE_URL}`, {
//                     params: {
//                         dataset: 'data-es',
//                         recordid: center._id
//                     },
//                     timeout: 5000
//                 });

//                 if (response.data.record) {
//                     const record = response.data.record;
//                     centersData.push({
//                         id: record.recordid,
//                         name: record.fields.ins_nom || 'Centre sportif',
//                         city: record.fields.com_nom || '',
//                         eventsCount: center.count
//                     });
//                 }
//             } catch (error) {
//                 console.error(`Erreur pour le centre ${center._id}:`, error.message);
//             }
//         }

//         res.json({
//             success: true,
//             data: centersData
//         });

//     } catch (error) {
//         console.error('Erreur lors de la récupération des centres populaires:', error.message);
//         res.status(500).json({
//             success: false,
//             message: 'Erreur lors de la récupération des centres populaires'
//         });
//     }
// });

module.exports = router;