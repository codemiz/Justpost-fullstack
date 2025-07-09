const express = require('express');
const app = express();
const path = require('path');
const multer= require("multer")
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mongoose = require("mongoose");
const post = require('./models/post');
const cloudinary = require("cloudinary")


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended:true}))

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Math.round(Math.random() * 1000000)+ path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ dest: "uploads/" });

//main routes
app.get('/',isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({_id:req.user.id});
  const posts = await postModel.find().populate("userID");
  res.render("home",{user,posts})
  
  
});
app.get('/register', (req, res) => {
  res.render('register' , {error: null});
});
app.get('/logout', (req, res) => {
  
  res.cookie("token","")
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login' , {error : null});
});


app.get('/profile',isLoggedIn,async (req, res) => {
  
  const user = await userModel.findOne({_id:req.user.id}).populate("posts");
  
  res.render('profile',{user});
});
app.get("/:username",async (req,res)=>{
  try {
    const user = await userModel.findOne({ username: req.params.username }).populate("posts");
    if (!user) {
        return res.status(404).send('User not found');
    }
    res.render('public-profile', { user });
} catch (error) {
    console.error(error);
    res.status(500).send('Server error');
}
})
app.get("/post/:postid",async (req,res)=>{
  const post = await postModel.findOne({_id:req.params.postid}).populate("userID");
  console.log(post);
  res.render('post',{post});
})

//Api routes
app.post("/upload/profile/pic",isLoggedIn,upload.single('avatar'), async (req,res)=>{
  const user = await userModel.findOne({_id:req.user.id});
  if(!user){
    res.redirect("/profile")
  }
  const result = await cloudinary.uploader.upload(req.file.path , { folder : "JustPost"})
  console.log(result);
  
  user.profilePic = result.secure_url;
  await user.save();
  res.redirect("/profile")
})
app.post("/upload/status",isLoggedIn, async (req,res)=>{
  const user = await userModel.findOne({_id:req.user.id});

  user.status = req.body.content;
  await user.save();
  res.redirect("/profile")
})
app.post("/user/signup", async (req,res)=>{
  const {name,username,email,password,age,gender} = req.body;
  
  const user = await userModel.findOne({email})
  if(user){
    console.log(user);
    
    return res.render("register" , {error: "Email already exists. try logging in."})
  }
  
  if(password.length < 6){
    return res.render("register" , {error: "Password should be minimum of 6 charactars."})
  }
  const oldUsername = await userModel.findOne({username: username.toLowerCase()})
  if(oldUsername){
    return res.render("register" , {error: "Username already taken."})
    
  }
  const hashedPassword =await bcrypt.hash(password , 10)
  const newUser =await userModel.create({
    name,
    username: username.toLowerCase(),
    email,
    password : hashedPassword,
    profilePic:"https://res.cloudinary.com/dxpbvp4bj/image/upload/v1752061974/profile_default_kociqs.jpg",
    age,
    gender,
    status:"This is default status, you can upload your own status updates."
  })
  console.log(newUser);
  let token =  jwt.sign({email: email, id:newUser._id},process.env.JWT_SECRET);
  res.cookie("token",token,{maxAge:2592000000})
  res.redirect("/")
})
app.post("/user/login", async (req,res)=>{
  const {email,password} = req.body;
  
  const oldUser =await userModel.findOne({email})
  console.log(oldUser);
  if(!oldUser) {
    return res.render("login" , {error : "User not found"})
  } 
  const isMatch = await bcrypt.compare(password , oldUser.password)
  if(!isMatch){
    return res.render("login" , {error : 'Wrong password'})
  } 
  let token =  jwt.sign({email: email, id:oldUser._id},process.env.JWT_SECRET);
  res.cookie("token",token,{maxAge:2592000000})
  res.redirect("/")
})

app.post("/user/post",isLoggedIn, async (req,res)=>{
  let cdate= new Date();
  let date= cdate.toLocaleString();
  console.log(date);
  const postContent = req.body.content;
  const user = await userModel.findOne({_id:req.user.id});
  const newPost = await postModel.create({
    content : postContent,
    date,
    userID:user._id,
    autherName: user.name
  })
  await user.posts.push(newPost._id);
  user.save();
  console.log(newPost);
  res.redirect("/profile")
})
app.post("/user/home/post",isLoggedIn, async (req,res)=>{
  let cdate= new Date();
  let date= cdate.toLocaleString();
  const postContent = req.body.content;
  const user = await userModel.findOne({_id:req.user.id});
  const newPost = await postModel.create({
    content : postContent,
    date,
    userID:user._id,
    autherName: user.name
  })
  await user.posts.push(newPost._id);
  user.save();
  console.log(newPost);
  res.redirect("/")
})

//homepage reacts
app.get("/home/like/:id", isLoggedIn,async (req,res)=>{
  const post = await postModel.findOne({_id:req.params.id});
  if (post.likes.indexOf(req.user.id)===-1){
    if (post.hearts.indexOf(req.user.id)===-1){
      post.likes.push(req.user.id);
  
    }else{
      post.hearts.splice(post.likes.indexOf(req.user.id),1)
      post.likes.push(req.user.id);
    }
    

  }else{
    post.likes.splice(post.likes.indexOf(req.user.id),1)
  }
  await post.save();
  console.log(req.user);
 res.redirect("/")
})

app.get("/home/react/:id", isLoggedIn,async (req,res)=>{
  const post = await postModel.findOne({_id:req.params.id});
  if (post.hearts.indexOf(req.user.id)===-1){
    if (post.likes.indexOf(req.user.id)===-1){
      post.hearts.push(req.user.id);
  
    }else{
      post.likes.splice(post.likes.indexOf(req.user.id),1)
      post.hearts.push(req.user.id);
    }
    

  }else{
    post.hearts.splice(post.likes.indexOf(req.user.id),1)
  }
  await post.save();
  
 res.redirect("/")
})

//profile reacts
app.get("/like/:id", isLoggedIn,async (req,res)=>{
  const post = await postModel.findOne({_id:req.params.id});
  if (post.likes.indexOf(req.user.id)===-1){
    if (post.hearts.indexOf(req.user.id)===-1){
      post.likes.push(req.user.id);
  
    }else{
      post.hearts.splice(post.likes.indexOf(req.user.id),1)
      post.likes.push(req.user.id);
    }
    

  }else{
    post.likes.splice(post.likes.indexOf(req.user.id),1)
  }
  await post.save();
  console.log(req.user);
 res.redirect("/profile")
})

app.get("/react/:id", isLoggedIn,async (req,res)=>{
  const post = await postModel.findOne({_id:req.params.id});
  if (post.hearts.indexOf(req.user.id)===-1){
    if (post.likes.indexOf(req.user.id)===-1){
      post.hearts.push(req.user.id);
  
    }else{
      post.likes.splice(post.likes.indexOf(req.user.id),1)
      post.hearts.push(req.user.id);
    }
    

  }else{
    post.hearts.splice(post.likes.indexOf(req.user.id),1)
  }
  await post.save();
  
 res.redirect("/profile")
})

app.get("/post/edit/:id",isLoggedIn, async (req,res)=>{
  const post = await postModel.findOne({_id:req.params.id});
  res.json({post})
})
app.get("/post/delete/:id",isLoggedIn, async (req,res)=>{
  await postModel.deleteOne({_id:req.params.id});
  res.redirect("/profile")
})

app.post("/post/edit/:id",isLoggedIn, async (req,res)=>{
  const post = await postModel.findOne({_id:req.params.id});
  post.content = req.body.content;
  await post.save();
  
  res.redirect("/profile")
})
//loggedin check
function isLoggedIn(req,res,next){
  
  if((req.cookies.token==="") || (!req.cookies.token)){ 
    console.log(req.cookies)
    res.render("login" , {error: null})
  }else{
    // console.log(req.cookies);
    let data= jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    // console.log(data);
    req.user = data;
    next();
  }
  
}


app.listen(3000, () => {
  console.log(`Server is running on port ${3000}`);
});

