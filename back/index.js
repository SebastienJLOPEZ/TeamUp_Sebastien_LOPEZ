require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/user');
const eventRoutes = require('./routes/event');
const messageRoutes = require('./routes/message');
const centerRoutes = require('./routes/center');
const clubRoutes = require('./routes/club');

// const cron = require('node-cron');
// const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    })
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/center', centerRoutes);
app.use('/api/club', clubRoutes);

app.listen(port, () => {
    console.log(`Server is running on ${process.env.PUBLIC_BACKEND_PATH}`);
});

// cron.schedule('0 * * * *', async () => {
//     try {
//         console.log('Cron Job : Mise à jour des événements');
//         const eventsResponse = await axios.get(`${process.env.PUBLIC_BACKEND_PATH}/api/event`);
//         const events = eventsResponse.data;

//         for (const event of events) {
//             const now = new Date();
//             const startDate = new Date(event.date);
//             const endDate = new Date(event.endDate);
//             const weekTime = 7 * 24 * 60 * 60 * 1000;

//             // Si l'évènement est dans plus d'une semaine
//             if (startDate - now < weekTime) {
//                 await axios.post(
//                     `${process.env.PUBLIC_BACKEND_PATH}/api/message/notify-participants`,
//                     { participantIds: event.participants, eventId: event._id }
//                 );
//             }

//             // Si l'heure de fin est dépassée
//             if (endDate < now && !event.finished) {
//                 await axios.post(`${process.env.PUBLIC_BACKEND_PATH}/api/event/${event._id}/finish`);
//             }
//         }
//         console.log('Cron Job : Mise à jour des événements terminée', response.data);
//     } catch (error) {
//         console.error('Cron Job : Erreur lors de la mise à jour des événements', error);
//     }
// });