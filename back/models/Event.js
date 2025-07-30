const mongoose = require('mongoose');
const { create } = require('./User');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    sport: {
        type: String,
        required: true,
        trim: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    maxParticipants: {
        type: Number,
        required: true,
        min: 1
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    // ID du centre sportif depuis l'API gouvernementale
    centerId: {
        type: String,
        required: true,
        index: true // Index pour optimiser les requêtes
    },
    // Cache des données du centre pour éviter les appels répétés
    centerData: {
        name: String,
        address: String,
        city: String,
        zipCode: String,
        depCode: String,
        regCode: String,
        coordinates: {
            lat: Number,
            lng: Number
        },
        equipments: [String],
        lastUpdated: Date
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'completed'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index composé pour optimiser les requêtes fréquentes
eventSchema.index({ creator: 1, date: 1 });
eventSchema.index({ participants: 1, date: 1 });
eventSchema.index({ centerId: 1, date: 1 });

// Méthode pour vérifier si les données du centre sont à jour (cache de 24h)
eventSchema.methods.isCenterDataFresh = function() {
    if (!this.centerData || !this.centerData.lastUpdated) {
        return false;
    }
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.centerData.lastUpdated > oneDayAgo;
};

module.exports = mongoose.model('Event', eventSchema, process.env.EVENT);