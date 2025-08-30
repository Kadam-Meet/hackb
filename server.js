require('dotenv').config();

const express = require('express');

const mongoose = require('mongoose');

const cors = require('cors'); // <-- 1. IMPORT THE CORS PACKAGE

const userRoutes = require('./Routes/user'); // Make sure this path is correct



const app = express();

const PORT = process.env.PORT || 5000;



// --- MIDDLEWARE ---

app.use(cors()); // <-- 2. ADD THE CORS MIDDLEWARE

app.use(express.json()); // Middleware to parse JSON bodies



// --- DATABASE CONNECTION ---

const connectDB = async () => {

  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB Connected... ✅');

  } catch (err) {

    console.error('MongoDB Connection Error:', err.message);

    process.exit(1);

  }

};



connectDB();



// --- API ROUTES ---

app.use('/api/user', userRoutes);


// --- START THE SERVER ---

app.listen(PORT, () => {

  console.log(`Server is running on http://localhost:${PORT}`);

});