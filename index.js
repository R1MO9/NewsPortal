import express, { response } from 'express';
import bodyParser from 'body-parser';

// for admin authentication
import session from 'express-session';
import axios from 'axios';
import multer from 'multer';

const port = 3000;
const app = express();

app.use(express.static("public"));

app.use(bodyParser.json());
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
const API_URL = "http://localhost:4000";

app.get("/adminPage",authenticateUser, async (req, res) =>{
  try {
    const response = await axios.get(`${API_URL}/posts`);

    res.render("partials/adminPanel.ejs", { Total_news: response.data.length });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }

})

const storage = multer.diskStorage({
  destination : function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename : (req, file, cb)=>{
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
    
  }
})

const upload = multer({ storage: storage });

app.get("/addNews", authenticateUser,(req,res)=>{
    res.render("partials/addNews.ejs",{heading:"Add News"});
})

 // get data from a  post
 app.get("/edit/:id",authenticateUser, async (req, res) => {

    try {
      const response = await axios.get(`${API_URL}/posts/${req.params.id}`);
      console.log(response.data);
      res.render("partials/addNews.ejs", {
        heading: "Edit News",
        post: response.data,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching post" });
    }
  });

  


// Route to render the main page
app.get("/allNews",authenticateUser, async (req, res) => {
    try {
      const response = await axios.get(`${API_URL}/posts`);

      res.render("partials/allNews.ejs", { posts: response.data });
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts" });
    }
  
  });

  

// Create a new post
app.post("/api/posts",authenticateUser,upload.single("banner_img"),async (req, res) => {

    const title = req.body.title;
    const newsContent = req.body.newsContent;
    const caption = req.body.caption;
    let requestData = {
      title: title,
      content: newsContent,
      img_caption: caption,
    };
  
    // Check if an image is provided
    if (req.file) {
      const image = req.file.filename;
      requestData.banner_img = image;
    }
   
    try {
      const response = await axios.post(`${API_URL}/posts`, requestData);
    
      res.redirect("/allNews");
    } catch (error) {
      res.status(500).json({ message: "Error creating post" });
    }
  });

  // patially update
  app.post("/api/posts/:id",authenticateUser,upload.single("banner_img"),async (req, res) => {
    console.log("called");
    const title = req.body.title;
    const newsContent = req.body.newsContent;
    const caption = req.body.caption;
  
    let requestData = {
      title: title,
      content: newsContent,
      img_caption: caption,
    };
  
    // Check if an image is provided
    if (req.file) {
      const image = req.file.filename;
      requestData.banner_img = image;
    }
    try {
      const response = await axios.patch(
        `${API_URL}/posts/${req.params.id}`,requestData
      );
      console.log(response.data);
      res.redirect("/allNews");
    } catch (error) {
      res.status(500).json({ message: "Error updating post" });
    }
  });

  // Delete a post
app.get("/api/posts/delete/:id",authenticateUser, async (req, res) => {
    const id = req.params.id;
   console.log(req.params.id);
    try {
      await axios.delete(`${API_URL}/posts/${req.params.id}`);
      res.redirect("/allNews");
    } catch (error) {
      res.status(500).json({ message: "Error deleting post" });
    }
  });

  // Logout route

app.get("/logout", (req, res) => {
  // Destroy the session to log the user out
  req.session.destroy((err) => {
      if (err) {
          console.error("Error destroying session:", err);
          // Handle the error if necessary
      } else {
          // Redirect to the login page or any other desired destination after logout
          res.redirect("/");
      }
  });
});
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
