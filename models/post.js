const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    content:String,
    date:{
        type:Date,
        default: Date.now()
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    autherName:String,
    likes:[
        
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"user"
        }
    ],
    hearts:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"user"
    }
]
});


module.exports = mongoose.model("post",postSchema);