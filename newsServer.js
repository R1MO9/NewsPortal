import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 5000;
const API_URL = "http://localhost:4000";

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.get("/posts", async (req, res) => {
    try {
    //   const postId = req.params.id;
    const response = await axios.get(`${API_URL}/posts`);

    //   const post = await PostNews.findById(postId).lean();
        
    console.log("API Response:", response);

    if (!Array.isArray(response.data) || response.data.length === 0) {
        return res.status(404).send("Posts not found");
      }
  
      // Iterate over each item in the response data array
      for (let i = 0; i < response.data.length; i++) {
        const post = response.data[i];
  
        // Perform actions on each post
        console.log(`Processing post ${i + 1}: ${post.title}`);
  
        // if (post.hasOwnProperty("banner_img")) {
        // const imgData = Buffer.from(post.banner_img.data).toString("base64");
        // const imgSrc = `data:${post.banner_img.contentType};base64,${imgData}`;
        
        // console.log(imgSrc);
        // res.render("post.ejs", { post : post,imgSrc: imgSrc});
        // }
        const  img_src = post.banner_img.image;
        console.log(img_src);
        
        res.render("post.ejs", { post : post,imgSrc: post.banner_img.image});
      }
        // response.data.forEach(post => {

        // const imgData = Buffer.from(post.banner_img.data).toString("base64");
        // const imgSrc = `data:${post.banner_img.contentType};base64,${imgData}`;

        // });
 // Render your EJS file with the array of posts with images
  
     
      
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
  });
  