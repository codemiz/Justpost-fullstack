const express = require('express');
const app = express();
const path = require('path');
const userModel = require("./models/user");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended:true}))

//main routes
app.get('/',isLoggedIn, (req, res) => {
  res.render("home")
  
  
});
app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  let token =  jwt.sign({email:"email.com"},process.env.JWT_SECRET);
  console.log(token);
  res.cookie("token",token)
  res.render('login');
});

app.get('/profile', (req, res) => {
  res.render('profile');
});

//Api routes
app.post("/user/signup", async (req,res)=>{
  const {name,username,email,password,age,gender} = req.body;
  
  const newUser =await userModel.create({
    name,
    username,
    email,
    password,
    age,
    gender
  })
  console.log(newUser);
  let token =  jwt.sign({email: email, id:newUser._id},process.env.JWT_SECRET);
  res.cookie("token",token)
  res.redirect("/")
})


//loggedin check
function isLoggedIn(req,res,next){
  
  if((req.cookies.token==="") || (!req.cookies.token)){ 
    console.log(req.cookies)
    res.render("login")
  }else{
    console.log(req.cookies);
    let data= jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    console.log(data);
    next();
  }
  
}

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});