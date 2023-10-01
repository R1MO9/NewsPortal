const express = require('express');
const bodyParser =  require('body-parser');

const port = 3000;
const app = express();

app.use(express.static("public"));


app.use(bodyParser.urlencoded({extended:true}));

app.get("/",(req,res)=>{
    res.render("index.ejs");
})

app.get("/Admin_login",(req,res)=>{
    res.render("partials/loginPage.ejs");
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
