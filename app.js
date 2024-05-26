const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended:true}))

//main routes
app.get('/', (req, res) => {
  res.render("home");
});
app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/profile', (req, res) => {
  res.render('profile');
});

//Api routes
app.post("/user/signup",(req,res)=>{
  console.log(req.body);
  res.send("done")
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});