const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
dotenv.config();


const app = express();

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});
app.use('/api/auth', authLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/leads', require('./routes/leads'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));