const express = require('express');
const cookieParser = require('cookie-parser');
const cron = require("node-cron");
require('dotenv').config()
const usersRouter = require('./routes/usersRouter');
const connectDB = require('./utils/connectDB');
const { errorHandler } = require('./middlewares/errorMiddleware');
const openAIRouter = require('./routes/openAIRouter');
const razorRouter = require('./routes/razorRouter');
const User = require('./models/User');


 

connectDB()


const app = express();


//cron for trail period : run every single day
cron.schedule('0 0 * * * *', async() =>{
    console.log("this task run every second")
    try {
        //get the current date
        const today = new Date()
      const updatedUser = await User.updateMany({
        trailActive:true,
        trailExpire:{$lt: today}
       },
       {
        trailActive: false,
        subscriptionPlan: 'Free',
        monthlyRequestCount: 5,
       },
    )
       console.log(updatedUser);
       
    } catch (error) {
        console.log(error)
    }
})

//cron for the free plan : run every at the end of every month
cron.schedule('0 0 1 * * *', async() =>{
    
    try {
        //get the current date
        const today = new Date()
      await User.updateMany({
        subscriptionPlan:"Free",
        trailExpire:{$lt: today}
       },
       {
       
        monthlyRequestCount: 0,
       },
    )
       console.log(updatedUser);
       
    } catch (error) {
        console.log(error)
    }
})

//cron for the basic plan : run every at the end of every month
cron.schedule('0 0 1 * * *', async() =>{
    
    try {
        //get the current date
        const today = new Date()
      await User.updateMany({
        subscriptionPlan:"Basic",
        nextBillingDate:{$lt: today}
       },
       {
       
        monthlyRequestCount: 0,
       },
    )
       
       
    } catch (error) {
        console.log(error)
    }
})

//cron for the Premium plan : run every at the end of every month
cron.schedule('0 0 1 * * *', async() =>{
    
    try {
        //get the current date
        const today = new Date()
      await User.updateMany({
        subscriptionPlan:"Premium",
        nextBillingDate:{$lt: today}
       },
       {
       
        monthlyRequestCount: 0,
       },
    )
       
       
    } catch (error) {
        console.log(error)
    }
})
//cron paid plan

//----middlewares----
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())//pass the cookie automatically

//----Routes---- 

app.use("/api/v1/users",usersRouter)
app.use("/api/v1/openai",openAIRouter)
app.use("/api/v1/RazorPay",razorRouter)



//---error handler middleware----
app.use(errorHandler)
//start the server
const PORT =process.env.PORT || 5000
app.listen(PORT, console.log(`server is running on port ${PORT}`))