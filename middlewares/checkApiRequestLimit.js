const asyncHandler =  require("express-async-handler");
const User = require("../models/User");

const checkApiRequestLimit = asyncHandler(async(req, res , next) => {
    if (!req.user) {
        return res.status(401).json({message : "not authorized"})
    }
    // Find the user 
    const user = await User.findById(req?.user?.id);
    if (!user) {
        return res.status(404).json({ message : "User not found"})
    }
    let requestLimit = 0;
    //check if the user is on the trail period
    if(user?.trailActive) {
        requestLimit = user?.monthlyRequestCount;
    }
    
   // check the user has exceeds the trial period
   if (user?.apiRequestCount >= requestLimit) {
    throw new Error("API request limit reached, please subscribe a plan")
   }

    next()
})

module.exports = checkApiRequestLimit;