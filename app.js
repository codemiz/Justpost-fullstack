const express = require('express');
const app = express();
const path = require('path');
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mongoose = require("mongoose");
const post = require('./models/post');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended:true}))


//main routes
app.get('/',isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({_id:req.user.id});
  const posts = await postModel.find();
  res.render("home",{user,posts})
  
  
});
app.get('/register', (req, res) => {
  res.render('register');
});
app.get('/logout', (req, res) => {
  
  res.cookie("token","")
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/profile',isLoggedIn,async (req, res) => {
  
  const user = await userModel.findOne({_id:req.user.id}).populate("posts");
  
  res.render('profile',{user});
});

//Api routes
app.post("/user/signup", async (req,res)=>{
  const {name,username,email,password,age,gender} = req.body;
  
  const newUser =await userModel.create({
    name,
    username,
    email,
    password,
    profilePic:"profile_default.jpg",
    age,
    gender
  })
  console.log(newUser);
  let token =  jwt.sign({email: email, id:newUser._id},process.env.JWT_SECRET);
  res.cookie("token",token)
  res.redirect("/")
})
app.post("/user/login", async (req,res)=>{
  const {email,password} = req.body;
  
  const oldUser =await userModel.findOne({email})
  console.log(oldUser);
  let token =  jwt.sign({email: email, id:oldUser._id},process.env.JWT_SECRET);
  res.cookie("token",token)
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
    post.likes.push(req.user.id);

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
    post.hearts.push(req.user.id);

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
    post.likes.push(req.user.id);

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
    post.hearts.push(req.user.id);

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
    res.render("login")
  }else{
    // console.log(req.cookies);
    let data= jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    // console.log(data);
    req.user = data;
    next();
  }
  
}

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

