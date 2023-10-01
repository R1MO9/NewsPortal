const express = require('express');
const bodyParser =  require('body-parser');
const session = require('express-session');

const port = 3000;
const app = express();

app.use(express.static("public"));


app.use(bodyParser.urlencoded({extended:true}));

// Set up express-session middleware
app.use(session({
    secret: 'c957fa32c75dcd49f0becb7346e566b529a4795ef001a640b6b0ea1c74dea2ca', // Replace with a strong secret key
    resave: true,
    saveUninitialized: true
}));


app.get("/",(req,res)=>{
    res.render("index.ejs");
})

app.get("/Admin_login",(req,res)=>{
    res.render("partials/loginPage.ejs");
})

const masterId = "master12494290@admin.secure.self";
const masterKey = "tRg!v&z#2$v2$9p&z#L6"

// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        // User is authenticated, proceed to the next middleware or route handler
        return next();
    } else {
        // User is not authenticated, redirect to the login page or handle it accordingly
        res.redirect("/Admin_login");
    }
};

app.get("/adminPage", authenticateUser,(req,res)=>{

    res.render("partials/adminPanel.ejs");
})

app.get("/errorPage",(req,res)=>{

    res.render("partials/random404.ejs");
})

app.post("/submit",async(req,res)=>{

    const adminId = req.body.adminId;
    const password = req.body.password;


    try {
        if (adminId === masterId && password === masterKey) {
            console.log("correct id & pass");
            // Redirect to the AdminPage route
            req.session.authenticated = true;
            
            res.redirect("/adminPage");
            
        } else {
            console.log("check id");
            // Redirect to an error page or handle the error accordingly
            res.redirect("/Admin_login");
        }
    } catch (err) {
        console.log(err);
        // Handle other errors
        res.redirect("/errorPage");
    }
})



app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
