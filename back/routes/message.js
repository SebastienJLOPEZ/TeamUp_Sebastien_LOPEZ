const express = require('express');
const User = require('../models/User');
const Message = require('../models/Message');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/send', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { recipient, subject, content } = req.body;

        if (!recipient || !subject || !content) {
            return res.status(400).json({ message: 'Recipient, subject and content are required' });
        }

        const message = new Message({
            sender: userId,
            senderType: 'user',
            recipient,
            subject,
            content
        });

        await message.save();
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/listreceived', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const messages = await Message.find({ 
            recipient: userId,
            'isDeleted.1': { $ne: true }
        })
            .populate('sender', 'name surname')
            .sort({ createdAt: -1 });

        const formattedMessages = messages.map(msg => {
            let senderInfo;
            if (msg.sender && msg.senderType === 'user') {
                senderInfo = {
                    name: msg.sender.name,
                    surname: msg.sender.surname,
                };
            } else {
                senderInfo = {
                    name: 'Message Système',
                    surname: '',
                };
            }
            return {
                _id: msg._id,
                sender: senderInfo,
                recipient: msg.recipient,
                subject: msg.subject,
                content: msg.content,
                createdAt: msg.createdAt
            };
        });

        res.status(200).json({ messages: formattedMessages });
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
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/listsend', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const messages = await Message.find({
            sender: userId,
            'isDeleted.0': { $ne: true }
        })
            .populate('recipient', 'name surname')
            .sort({ createdAt: -1 });

        const formattedMessages = messages.map(msg => {
            if (msg.recipient) {
                recipientInfo = {
                    name: msg.recipient.name,
                    surname: msg.recipient.surname,
                };
            } else {
                recipientInfo = {
                    name: 'Message Système',
                    surname: '',
                };
            }
            return {
                sender: {
                name: msg.sender.name,
                surname: msg.sender.surname
            },
            recipient: msg.recipient,
            subject: msg.subject,
            content: msg.content,
            createdAt: msg.createdAt
            }
    });

        res.status(200).json({ messages: formattedMessages });
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
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/list/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const messageId = req.params.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.status(200).json({ message });
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
        console.error('Error fetching message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/delete', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { messageId } = req.body;
        if (!messageId) {
            return res.status(400).json({ message: 'Message ID is required' });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Ajoute un élément true dans la liste isDeleted
        if (message.sender.equals(userId)) {
            message.isDeleted[0] = true;
        } else {
            message.isDeleted[1] = true;
        }

        await message.save();
        res.status(200).json({ message: 'Message deleted successfully' });
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
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/notify-participants', async (req, res) => {
    const { participantIds, eventId } = req.body;

    if (!participantIds || !Array.isArray(participantIds)) {
        return res.status(400).json({ message: 'Invalid participant IDs' });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Événement non trouvé'
            });
        }
        const eventName = event.name || 'Événement sans nom';
        const subject = 'Évènement à venir dans moins d\'une semaine';
        const content = `L'évènement "${eventName}" que vous avez rejoint va bientôt commencer. Merci de vous préparer.`;

        for (const userId of participantIds) {
            const user = await User.findById(userId);
            if (!user) {
                console.log(`User with ID ${userId} not found`);
            } else {
                // Vérifier si le message existe déjà
                const alreadySent = await Message.findOne({
                    sender: 'system',
                    recipient: userId,
                    subjet: subject,
                    content: content
                });
                if (!alreadySent) {
                    await Message.create({
                        sender: 'system',
                        recipient: userId,
                        subjet: subject,
                        content: content,
                    });
                }
            }
        }

        res.status(200).json({ message: 'Notifications envoyées' });
    } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi des notifications' });
    }
});

module.exports = router;