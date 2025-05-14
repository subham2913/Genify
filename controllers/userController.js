const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const asyncHandler = require("express-async-handler")
const User = require("../models/User");
const isAuthenticated = require("../middlewares/isAuthenticated");

// Registration
const register = asyncHandler( async (req, res ) => {
    
        

        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            console.log(" Missing fields"); //  Log missing fields
            res.status(400);
            throw new Error("all field are required")
        }

        // Check if the email is already taken
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log(" User already exists:", email); //  Log existing user
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        console.log(" New user created (not saved yet):", newUser);
        
        

          // add the date the trail will end
          newUser.set("trailExpire", new Date(
            new Date().getTime() + newUser.trailPeriod * 24 * 60 * 60 * 1000
        ));
        // Save the user
        await newUser.save();
        console.log(" User saved successfully");

        res.json({
            status: true,
            message: "Registration was successful",
            user: {
                username,
                email,
            },
        });
    
})


// Login
const login = asyncHandler(async(req, res) => {
    const { email, password } = req.body;
    // check for user email
    const user = await User.findOne ({email});
    console.log(user)
    if(!user){
        res.status(401);
        throw new Error("Invalid email or password ")
    }

    const isMatch = await bcrypt.compare(password, user?.password);
    if(!isMatch) {
        res.status(401)
        throw new Error("Invalid email or password");
        
    }
    //Generate token (jwt)
    const token = jwt.sign({id: user?._id}, process.env.JWT_SECRET,{
        expiresIn: '3d'// token expire in 3 days 
    })
    console.log(token)
    //set the token into cookies (http only)
    res.cookie("token",token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,//1 day  
    })

    //send the response
    res.json({
        status: "success",
        _id: user?._id,
        message:"Login successfull",
        username: user?.username,
        email: user?.email
    });
})

// Logout
const logout = asyncHandler(async (req, res) =>{
    res.cookie("token", "", {maxAge: 1 });
    res.status(200).json({ message: "Logged out successfully"});
})

// Profile
const userProfile = asyncHandler(async( req, res) => {
    
    
    const user = await User.findById(req?.user?.id)
    .select('-password')
    .populate('payments').populate('history')

    if (user) {
       

        res.status(200).json({
            status: "success",
            user,
        });
    } else {
        res.status(404);
        throw new Error ("user not found")
    }
}) 

// check for user Auth status
const checkAuth = asyncHandler(async (req , res) => {
    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    if (decoded) {
     res.json({
        isAuthenticated: true,
     })        
    } else {
        res.json({
            isAuthenticated: false
        })
    }
})

module.exports = { 
    register,
    login,
    logout,
    userProfile,
    checkAuth,
}; 
