const express = require('express');
const Club = require('../models/Club');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/create', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const ownerId = decoded.userId;

        const { name, description, sport, location } = req.body;

        if (!name || !sport) {
            return res.status(400).json({ message: 'Name and sport are required' });
        }

        const newClub = new Club({
            name,
            description,
            sport,
            location,
            owner: ownerId
        });

        await newClub.save();

        res.status(201).json({
            success: true,
            data: newClub
        });
    } catch (error) {
        console.error('Error creating club:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
