const express = require('express');
const app = express();
const path = require('path');
const userModel = require("./models/user")
const cookieParser = require('cookie-parser')

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended:true}))

//main routes
app.get('/',isLoggedIn, (req, res) => {
  if(isLoggedIn){
    res.render("home")
  }else{
    res.render("login");

  }
  
});
app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/profile', (req, res) => {
  console.log(req.cookies.token)
  res.render('profile');
});

//Api routes
app.post("/user/signup",(req,res)=>{
  const {name,username,email,password,age,gender} = req.body;
  const newUser = userModel.create({
    name,
    username,
    email,
    password,
    age,
    gender
  })
  console.log(req.body);
  res.redirect("/")
})


//loggedin check
function isLoggedIn(){
  
    return true
  
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});