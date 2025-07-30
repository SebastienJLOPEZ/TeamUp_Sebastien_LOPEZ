const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user ||!(await user.comparePassword(password))) {
        return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, refreshToken, userId: user._id });

});

router.post('/register', async (req, res) => {
    const { name, surname, email, sport, level, disponibility, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }

        const newUser = new User({ name, surname, email, sport, level, disponibility, password });
        await newUser.save();

        const welcomeMessage = new Message({
            sender: 'Équipe TeamUp',
            senderType: 'system',
            recipient: newUser._id,
            subject: 'Bienvenue sur TeamUp !',
            content: `Bonjour ${name},\n\nBienvenue sur TeamUp ! Nous sommes ravis de vous compter parmi nous.
            \n\nVous pouvez dès maintenant rejoindre ou créer des événements sportifs.\n\nBonne découverte !\nL'équipe TeamUp`
        });

        await welcomeMessage.save();

        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error.message);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

router.get('/refresh-token', (req, res) => {
    const { refreshToken } = req.headers.authorization?.split(' ')[1];

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const token = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(403).json({ message: 'Token de rafraichissement incorrect ou expiré' });
    }
});

module.exports = router;