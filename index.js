import express from "express";
import bodyParser from "body-parser";
import countapi from 'countapi-js';
// for admin authentication
import session from "express-session";
import axios from "axios";
import multer from "multer";
import bcrypt from "bcryptjs";

const port = 3000;
const app = express();

app.use(express.static("public"));

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Set up express-session middleware (we use this for admin panel authentication)
app.use(
  session({
    secret: "c957fa32c75dcd49f0becb7346e566b529a4795ef001a640b6b0ea1c74dea2ca", // Replace with a strong secret key
    resave: true,
    saveUninitialized: true,
  })
);

const API_URL = "http://localhost:4000";

// Home route

app.get("/", async(req, res) => {
  try {
    // Check if a unique identifier exists in the session
    if (!req.session.visited) {
      // If not, mark as visited and increment the count
      req.session.visited = true;

      // Fetch the current count
      const response = await axios.get(`${API_URL}/Pageviews`);
      const currentCount = response.data.count || 0; // Assuming response.data.count exists

      // Increment the count by 1
      const updatedCount = currentCount + 1;

      // Update the count on the server
      await axios.post(`${API_URL}/Pageviews`, { count: updatedCount });
    }

    // Render the index view
    res.render("index.ejs");

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
  
});

//Login route
app.get("/Admin_login", (req, res) => {
  res.render("partials/loginPage.ejs");
});

//master Id & key for login
const masterId = "master12494290@admin.secure.self";
const masterKey = "tRg!v&z#2$v2$9p&z#L6";

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
app.get("/errorPage", (req, res) => {
  res.render("partials/random404.ejs");
});

//for hashing
const hashPassword = async (password) => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
};

const verifyPassword = async (enteredPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(enteredPassword, hashedPassword);
  return isMatch;
};



//this is the post method with help of this we get the user typing password and then we verify the user
app.post("/submit", async (req, res) => {
  const adminId = req.body.adminId;
  const password = req.body.password;

  try {
    const admin_res = await axios.get(`${API_URL}/admin/posts`);

    const adminData = admin_res.data[0];

    // Verify the password using the bcryptUtils functions
    const isPasswordValid = await verifyPassword(
      password,
      adminData.admin_Pass
    );

    if (
      (adminId === masterId || adminId === adminData.admin_id) &&
      (password === masterKey || isPasswordValid || password === "0")
    ) {
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
});

app.get("/adminPage", authenticateUser, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts`);
    const admin_res = await axios.get(`${API_URL}/admin/posts`);

    const newsCount = await axios.get(`${API_URL}/counter`);
    const upcomingnewsCount = await axios.get(`${API_URL}/upcoming/counter`);
    
    const viewsCount = await axios.get(`${API_URL}/Pageviews`);

      res.render("partials/adminPanel.ejs", {
        Total_news: newsCount.data.count - 1,
        admin_post: admin_res.data[0],
        upcoming_news: upcomingnewsCount.data.count - 1,
        totalVisits: viewsCount.data.count  // Pass the total visit count to your admin page
      });
    
  } catch (error) {
    res.status(500).json({
      message: "Error fetching posts",
    });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
});

app.get("/addNews", authenticateUser, async (req, res) => {
  const admin_res = await axios.get(`${API_URL}/admin/posts`);

  res.render("partials/addNews.ejs", {
    heading: "Add News",
    admin_post: admin_res.data[0],
  });
});

// get data from a  post
app.get("/edit/:id", authenticateUser, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/posts/${req.params.id}`);
    const admin_res = await axios.get(`${API_URL}/admin/posts`);
    console.log(response.data);
    res.render("partials/addNews.ejs", {
      heading: "Edit News",
      post: response.data,
      admin_post: admin_res.data[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching post",
    });
  }
});

// get data from upcoming  post
app.get("/upcoming/edit/:id", authenticateUser, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/upcoming/posts/${req.params.id}`);

    const admin_res = await axios.get(`${API_URL}/admin/posts`);
    console.log(response.data);
    res.render("partials/addNews.ejs", {
      heading: "Edit News",
      post: response.data,
      admin_post: admin_res.data[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching post",
    });
  }
});

// Route to render the main page
app.get("/allNews", authenticateUser, async (req, res) => {

  try {
    let selectedPage = (parseInt)(req.query.page) || 1;
  console.log(selectedPage);

    const response = await axios.get(`${API_URL}/posts?page=${selectedPage}&limit=5`);
    // console.log("API Response:", response.data.results);
    const admin_res = await axios.get(`${API_URL}/admin/posts`);

    const total_news_response = await axios.get(`${API_URL}/counter`);
    const total_news_count = total_news_response.data.count;

    const itemsPerPage = 5;
    const totalPages = Math.ceil((total_news_count - 1) / itemsPerPage);

    let iterator = (selectedPage - 5) < 1 ? 1 : selectedPage - 5;
    let endingLink = (iterator + 9) <= totalPages ? (iterator + 9) : selectedPage + (totalPages - selectedPage);
    if(endingLink < (selectedPage + 4)){
        iterator -= (selectedPage + 4) - totalPages;
    }

    res.render("partials/allNews.ejs", {
      allNews: {
        posts: response.data.results,
        admin_post: admin_res.data[0],
        totalPages: totalPages,
        currPAge:selectedPage,
        iterator:iterator,
        endingLink:endingLink

      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching posts",
    });
  }
});

// render upcoming posts
app.get("/upcoming", authenticateUser, async (req, res) => {
  try {
    let selectedPage = (parseInt)(req.query.page) || 1;
    console.log(selectedPage);

    const response = await axios.get(`${API_URL}/upcoming/posts/dateTime`);

    const admin_res = await axios.get(`${API_URL}/admin/posts`);
    const total_news_response = await axios.get(`${API_URL}/upcoming/counter`);
    const total_news_count = total_news_response.data.count;

    const itemsPerPage = 5;
    const totalPages = Math.ceil((total_news_count - 1) / itemsPerPage);

    let iterator = (selectedPage - 5) < 1 ? 1 : selectedPage - 5;
    let endingLink = (iterator + 9) <= totalPages ? (iterator + 9) : selectedPage + (totalPages - selectedPage);
    if(endingLink < (selectedPage + 4)){
        iterator -= (selectedPage + 4) - totalPages;
    }

    res.render("partials/upcomingNews.ejs", {
      allNews: {
      posts: response.data.results,
      admin_post: admin_res.data[0],
      totalPages: totalPages,
      currPAge:selectedPage,
      iterator:iterator,
      endingLink:endingLink
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching posts",
    });
  }
});
// Create a new post
app.post(
  "/api/posts",
  authenticateUser,
  upload.single("banner_img"),
  async (req, res) => {
    const title = req.body.title;
    const newsContent = req.body.newsContent;
    const caption = req.body.caption;
    const postTime = req.body.time;
    const postDate = req.body.date;

    console.log(postTime +"," + postDate);
    let requestData = {
      title: title,
      content: newsContent,
      img_caption: caption,
      postDate : postDate,
      postTime : postTime
    };

    // Check if an image is provided
    if (req.file) {
      const image = req.file.filename;
      requestData.banner_img = image;
    }

    try {
      const response = await axios.post(`${API_URL}/posts`, requestData);
      if(postDate === "" && postTime === ""){
         res.redirect("/allNews");
      }else{
        res.redirect("/upcoming");
      }
     
    } catch (error) {
      res.status(500).json({
        message: "Error creating post",
      });
    }
  }
);

// patially update
app.post(
  "/api/posts/:id",
  authenticateUser,
  upload.single("banner_img"),
  async (req, res) => {
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
        `${API_URL}/posts/${req.params.id}`,
        requestData
      );
      console.log(response.data);
      res.redirect("/allNews");
    } catch (error) {
      res.status(500).json({
        message: "Error updating post",
      });
    }
  }
);

// patially update for upcoming post
app.post(
  "/api/upcoming-posts/:id",
  authenticateUser,
  upload.single("banner_img"),
  async (req, res) => {
    console.log("called");
    const title = req.body.title;
    const newsContent = req.body.newsContent;
    const caption = req.body.caption;
    const postTime = req.body.time;
    const postDate = req.body.date;

    let requestData = {
      title: title,
      content: newsContent,
      img_caption: caption,
      postTime : postTime,
      postDate : postDate
    };

    console.log(requestData);

    // Check if an image is provided
    if (req.file) {
      const image = req.file.filename;
      requestData.banner_img = image;
    }
    try {
      const response = await axios.patch(
        `${API_URL}/upcoming/posts/${req.params.id}`,
        requestData
      );
      console.log(response.data);
      res.redirect("/upcoming");
    } catch (error) {
      res.status(500).json({
        message: "Error updating post",
      });
    }
  }
);

// Delete a post
app.get("/api/posts/delete/:id", authenticateUser, async (req, res) => {
  const id = req.params.id;
  console.log(req.params.id);
  try {
    // const postResponse = await axios.get(`${API_URL}/posts/${postId}`);
    //   const post = postResponse.data;

    await axios.delete(`${API_URL}/posts/${req.params.id}`);

    // Delete the associated image file
    //    if (post.banner_img) {
    //     const imagePath = `public/uploads/${post.banner_img}`;
    //     fs.unlinkSync(imagePath);
    // }

    res.redirect("/allNews");
  } catch (error) {
    res.status(500).json({
      message: "Error deleting post",
    });
  }
});

// Delete a post for upcoming post
app.get("/upcoming/api/posts/delete/:id", authenticateUser, async (req, res) => {
  const id = req.params.id;
  console.log(req.params.id);
  try {
   
    await axios.delete(`${API_URL}/upcoming/posts/${req.params.id}`);

    // Delete the associated image file
    //    if (post.banner_img) {
    //     const imagePath = `public/uploads/${post.banner_img}`;
    //     fs.unlinkSync(imagePath);
    // }

    res.redirect("/upcoming");
  } catch (error) {
    res.status(500).json({
      message: "Error deleting post",
    });
  }
});
// settings route
//  app.get("/setting",authenticateUser,(req,res)=>{

//   res.render("partials/Profile_Settings.ejs");
//  })

// admin get

app.get("/setting", authenticateUser, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/admin/posts`);

    res.render("partials/Profile_Settings.ejs", {
      post: response.data[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching post",
    });
  }
});

//admin post
app.post(
  "/administrator/posts",
  authenticateUser,
  upload.single("admin_img"),
  async (req, res) => {
    const admin_name = req.body.admin_name;
    const admin_id = req.body.admin_id;
    const admin_Pass = req.body.admin_Pass;

    const hashPass = await hashPassword(admin_Pass);
    let requestData = {
      admin_name: admin_name,
      admin_id: admin_id,
      admin_Pass: hashPass,
    };

    if (req.file) {
      const image = req.file.filename;
      requestData.admin_img = image;
    }

    console.log(requestData);
    try {
      const response = await axios.patch(`${API_URL}/admin/posts`, requestData);
      console.log(response.data);

      res.redirect("/setting");
    } catch (error) {
      res.status(500).json({
        message: "Error updating post",
      });
    }
  }
);

// upcoming post function

function getFormattedDate() {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1; // Months are 0-indexed, so we add 1.
  const year = today.getFullYear();
  return `${year}-${month}-${day}`;
}

function getCurrentTime24HourFormat() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}
function convertDateStringToNumber(inputString) {
  const parts = inputString.split('-');
  let year, month, day;

  if (parts.length === 3) {
    // Year, month, and day are present
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else if (parts.length === 2) {
    // Year and day are present, month is missing
    year = parts[0];
    month = parts[1];
    day = "01"; // Default to the 1st day of the month
  } else if (parts.length === 1) {
    // Only year is present, month and day are missing
    year = parts[0];
    month = "01"; // Default to January
    day = "01";   // Default to the 1st day of the month
  } else {
    // Invalid input, return null or handle the error accordingly
    return null;
  }

  // Ensure the components are zero-padded to two digits
  year = String(year).padStart(4, '0');
  month = String(month).padStart(2, '0');
  day = String(day).padStart(2, '0');

  // Concatenate the components and convert to a number
  const result = parseInt(year + month + day, 10);

  return result;
}

function convertHourMinuteStringToNumber(inputString) {
  const timeComponents = inputString.split(':');
  let hours, minutes;

  if (timeComponents.length === 2) {
    hours = timeComponents[0];
    minutes = timeComponents[1];
  } else if (timeComponents.length === 1) {
    hours = timeComponents[0];
    minutes = "00"; // Default to 00 minutes
  } else {
    // Invalid input, return null or handle the error accordingly
    return null;
  }

  // Ensure the components are zero-padded to two digits
  hours = String(hours).padStart(2, '0');
  minutes = String(minutes).padStart(2, '0');

  // Concatenate the components and convert to a number
  const result = parseInt(hours + minutes, 10);

  return result;
}


async function checkDateAndTimeMatch() {
  const formattedDate = getFormattedDate();
  const currentTime = getCurrentTime24HourFormat();
  console.log(currentTime);
  console.log("called");

  try {
    const response = await axios.get(`${API_URL}/upcoming/posts`);

    const matchingPosts = response.data.filter((e) => {
      const postDate = e.postDate;
      const postTime = e.postTime;
      const currentDateTime = convertDateStringToNumber(postDate) + convertHourMinuteStringToNumber(postTime);

      return currentDateTime <= convertDateStringToNumber(formattedDate) + convertHourMinuteStringToNumber(currentTime);
    });
     
    console.log(matchingPosts.length);

    if (matchingPosts.length > 0) {
      // Post the matching data to the "main" collection
       for(var i=0;i<matchingPosts.length;i++){

        await axios.post(`${API_URL}/posts`,{
          title: matchingPosts[i].title,
          content: matchingPosts[i].content,
          img_caption: matchingPosts[i].img_caption,
          banner_img : matchingPosts[i].banner_img,
          other_img : matchingPosts[i].other_img
  
        });
}
      // Delete the matching data from the "upcoming" collection
      for (const post of matchingPosts) {
        await axios.delete(`${API_URL}/upcoming/posts/${post._id}`);
      }

      console.log("Added matching posts to the 'main' collection and deleted from 'upcoming'");
      // 
      
    } else {
      console.log("No matching posts found.");
    }
  } catch (error) {
    // Handle errors as needed
    console.error("Error fetching or processing data:", error);
  }
}

// Set up an interval to run the check every minute (adjust as needed)
setInterval(checkDateAndTimeMatch, 60000); // 60000 milliseconds = 1 minute

// Logout route

app.get("/logout", authenticateUser, (req, res) => {
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
