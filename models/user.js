const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/justpostDb");

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