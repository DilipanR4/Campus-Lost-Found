const mongoose = require('mongoose');

let isConnected = false;
let connectionError = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_lost_found';
  
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    connectionError = null;
    console.log(`\x1b[32m✔ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}\x1b[0m`);
    return true;
  } catch (error) {
    isConnected = false;
    connectionError = error.message;
    console.error(`\x1b[33m⚠ MongoDB Connection Warning: ${error.message}\x1b[0m`);
    console.log(`\x1b[36mℹ You can set your MongoDB connection string in .env file (MONGODB_URI=...)\x1b[0m`);
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('\x1b[33m⚠ MongoDB disconnected\x1b[0m');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  connectionError = null;
  console.log('\x1b[32m✔ MongoDB reconnected\x1b[0m');
});

function getDbStatus() {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    error: connectionError,
    uriSet: Boolean(process.env.MONGODB_URI),
  };
}

module.exports = { connectDB, getDbStatus };
