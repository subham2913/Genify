const mongoose = require('mongoose')

const connectDB = async () =>{
    try {
       const conn = await mongoose.connect("mongodb+srv://tiwari7696:9pfaKqJ4FGy9u9hR@mern-ai.xczzc.mongodb.net/Mern-Ai?retryWrites=true&w=majority&appName=Mern-Ai")
       console.log(`MongoDB connnected ${conn.connection.host}`)
    } catch (error) {
        console.error(`error connecting mongodb ${error.message}`)
        process.exit(1)
    }
} 
module.exports = connectDB