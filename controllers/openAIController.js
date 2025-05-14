const asyncHandler = require('express-async-handler');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ContentHistory = require('../models/ContentHistory');
const User = require('../models/User');
require('dotenv').config();

// Gemini API Controller
const geminiAIController = asyncHandler(async (req, res) => {
    
    const { prompt } = req.body;
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use latest model

        const result = await model.generateContent(prompt);
        const content = result.response.candidates[0].content.parts[0].text;

        
        console.log(content)
        res.json({ text: content });

        
        //Content History
         const newContent =   await  ContentHistory.create({
            user: req?.user?._id,
            content,
        })

        // push the content into user history
        const userFound = await User.findById(req?.user?._id)
        userFound.history.push(newContent?._id)
        //update the api request  count 
        userFound.apiRequestCount += 1;
        await userFound.save()

    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

module.exports = {
    geminiAIController,
};
