const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('email name surname createdAt');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            data: user
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

        console.error('Erreur lors de la récupération de l\'utilisateur:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Récupère la liste des utilisateurs que l'utilisateur connecté peut contacter

router.post('/messagelist', async (req, res) => { // Nom de la route à changer plus tard
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const eventsOwned = await Event.find({ organizer: userId }).select('participants');
        const eventsJoined = await Event.find({ participants: userId }).select('participants');
        const participantIds = [...new Set(eventsOwned.reduce((acc, event) => {
            if (Array.isArray(event.participants)) {
            acc.push(...event.participants);
            }
            return acc;
        }, []))];

        const organizerIDs = [... new Set(eventsJoined.reduce((acc, event) => {
            if (Array.isArray(event.participants)) {
                acc.push(event.organizer);
            }
            return acc;
        }, []))];

        const contactIds = [...new Set([...participantIds, ...organizerIDs].filter(id => id.toString() !== userId.toString()))];
        const contacts = await User.find({ _id: { $in: contactIds } }).select('name surname _id');

        res.json({
            success: true,
            data: contacts
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

        console.error('Erreur lors de la récupération de la liste des utilisateurs:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
