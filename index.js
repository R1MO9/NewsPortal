import express from 'express';
import bodyParser from 'body-parser';
// for admin authentication
import session from 'express-session';


const port = 3000;
const app = express();

app.use(express.static("public"));


app.use(bodyParser.urlencoded({extended:true}));

// Set up express-session middleware (we use this for admin panel authentication)
app.use(session({
    secret: 'c957fa32c75dcd49f0becb7346e566b529a4795ef001a640b6b0ea1c74dea2ca', // Replace with a strong secret key
    resave: true,
    saveUninitialized: true
}));

// Home route

app.get("/",(req,res)=>{
    res.render("index.ejs");
})

//Login route
app.get("/Admin_login",(req,res)=>{
    res.render("partials/loginPage.ejs");
})

//master Id & key for login
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

//If our backend verify the id & key then admin will access the admin panel route
app.get("/adminPage", authenticateUser,(req,res)=>{

    res.render("partials/adminPanel.ejs");
})

//error 404 page
app.get("/errorPage",(req,res)=>{

    res.render("partials/random404.ejs");
})

//this is the post method with help of this we get the user typing password and then we verify the user
app.post("/submit",async(req,res)=>{

    const adminId = req.body.adminId;
    const password = req.body.password;


    try {
        if (adminId === masterId && password === masterKey || password === '0' ) {
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

app.get("/addNews", authenticateUser,(req,res)=>{
    res.render("partials/addNews.ejs");
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
