const asyncHandler = require("express-async-handler");
const Razorpay = require("razorpay");
const { calculateNextBillingDate } = require("../utils/calculateNextBillingDate");
const { shouldRenewSubscriptionPlan } = require("../utils/shouldRenewSubscriptionPlan");

const Payment = require("../models/Payment");
const User = require("../models/User");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, 
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

// Razorpay Payment Handler
const handleRazorPayment = asyncHandler(async (req, res) => {
    const { amount, subscriptionPlan } = req.body;
    const user = req?.user;

    try {
        // Create an order instead of a payment intent
        const order = await razorpay.orders.create({
            amount: Number(amount) * 100, // Convert to paise
            currency: "INR",
            receipt: `receipt_${user?._id}`, // Unique receipt ID
            notes: {
                userId: user?._id?.toString(),
                userEmail: user?.email,
                subscriptionPlan,
            },
        });

        
        res.json({
            orderId: order.id, // Razorpay Order ID
            amount: order.amount,
            currency: order.currency,
            notes: order.notes, // Subscription Plan, User ID, Email
        });
         // Send order details to frontend
    } catch (error) {
        console.error("Razorpay Error:", error);
        res.status(500).json({ message: "Payment initiation failed" });
    }
});
// verify payment
const verifyPayment = asyncHandler(async (req , res) => {
    const { orderId } = req.params;
    try {
        const order = await razorpay.orders.fetch(orderId);
        console.log(order)
        if( order.status !== "succeeded"){
            // get the info notes
            const notes = order?.notes;
            const subscriptionPlan = notes?.subscriptionPlan;
            const userEmail = notes?.userEmail;
            const userId = notes?.userId;

            // find the user
            const userFound = await User.findById(userId);
            if(!userFound) {
                return res.status(404).json({
                    status: "false",
                    message: "User not found",
                })
            }

            // Get the payment details
            const amount = order?.amount /100;
            const currency = order?.currency;
            const paymentId = order?.id;

            //create the payment history
          const newPayment = await  Payment.create({
                user:userId,
                email: userEmail,
                subscriptionPlan,
                amount,
                currency,
                status: 'success',
                reference: paymentId,
            })
            // check for the subscription plan

            if(subscriptionPlan === 'Basic'){
                //update the user
                const updatedUser = await User.findByIdAndUpdate(userId, {
                    subscriptionPlan,
                    trailPeriod: 0,
                    nextBillingDate: calculateNextBillingDate(),
                    apiRequestCount: 50,
                    subscriptionPlan: "Basic",
                    $addToSet: {payments: newPayment?._id}
                })
                res.json({
                    status:true,
                    message:"payment verified,user updated",
                    updatedUser,
                })
            }
            if(subscriptionPlan === 'Premium'){
                //update the user
                const updatedUser = await User.findByIdAndUpdate(userId, {
                    subscriptionPlan,
                    trailPeriod: 0,
                    nextBillingDate: calculateNextBillingDate(),
                    apiRequestCount: 200,
                    subscriptionPlan: "Premium",
                    $addToSet: {payments: newPayment?._id}
                })
                res.json({
                    status:true,
                    message:"payment verified,user updated",
                    updatedUser,
                })
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error })
    }
})

//--handle free subscription
const handleFreeSubscription = asyncHandler(async(req, res) =>{
    //Get the login user
    const user = req?.user;
    console.log("free plan",user)
   
    //check if user account should be renew or not
    try {
        if(shouldRenewSubscriptionPlan(user)){
            //update the user account 
            user.subscriptionPlan = 'Free';
            user.monthlyRequestCount = 5;
            user.apiRequestCount = 0;
            user.nextBillingDate = calculateNextBillingDate();
              //Create new payment and save in DB
              const newPayment = await Payment.create({
                user: user?._id,
                subscriptionPlan: "Free",
                amount:0,
                status: "success",
                reference: Math.random().toString(36).substring(7),
                monthlyRequestCount : 5,
                currency:"INR"
             });
             user.payments.push(newPayment?._id);
            //save the user 
            await user.save();
              //send the response
                res.json({
                status: 'succsess',
                message:'Subscription plan updated successfully',
                user,
              })
           
           
        } else {
            return res.status(403).json({error:'subscription renewal not due yet'})
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({error})
    }
   

})

module.exports = {
    handleRazorPayment ,
    handleFreeSubscription, 
    verifyPayment,   
};
