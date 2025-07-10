require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const autRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/user');
const eventRoutes = require('./routes/event');
const messageRoutes = require('./routes/message');

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

app.use('/api/auth', autRoutes);
app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/message', messageRoutes);

app.listen(port, () => {
    console.log(`Server is running on ${process.env.PUBLIC_BACKEND_PATH}`);
});


