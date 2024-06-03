const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

const userSchema = mongoose.Schema({
    name: String,
    username:{
        type : String,
        unique:true
    },
    email:String,
    password:String,
    age:Number,
    gender:String,
    status:String,
    profilePic:String,
    posts:[

        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"post"
        }
    ]
})
module.exports = mongoose.model("user",userSchema);