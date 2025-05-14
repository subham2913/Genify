const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const {handleRazorPayment, handleFreeSubscription, verifyPayment} = require("../controllers/handleRazorPayment");

const razorRouter = express.Router();

razorRouter.post("/checkout", isAuthenticated , handleRazorPayment);
razorRouter.post("/free-plan", isAuthenticated , handleFreeSubscription);
razorRouter.post("/verify-payment/:orderId", isAuthenticated , verifyPayment);

module.exports = razorRouter;