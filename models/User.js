const   mongoose  = require("mongoose")



//Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type:String,
        required: true,
    },
    password: {
        type:String,
        required: true,
    },
    trailPeriod: {
        type: Number,
        default: 3,
    },
    trailActive: {
        type:Boolean,
        required:true,
        default:true,
    },
   
    trailExpire: {
        type: Date,
    },
    subscriptionPlan: {
        type: String,
        enum: ['Trail','Free', 'Basic', 'Premium']
    },
    apiRequestCount: {
        type: Number,
        default: 0,
    },
    monthlyRequestCount: {
        type: Number,
        default: 500 // 500 CREDIT FOR 3 DAYS
    },
    nextBillingDate: Date,
    payments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
        },
    ],
    history: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "History",
        },
    ],
},
{
    timestamps: true,
    toJSON : {virtuals: true},
    toObject: {virtuals: true}
}
);


//! compile to form the model 

const User = mongoose.model("User",UserSchema);

module.exports = User;