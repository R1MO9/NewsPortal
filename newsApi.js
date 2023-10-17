import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import fs from "fs";
//for file uploading
import multer from "multer";

const app = express();
const port = 4000;

mongoose.connect("mongodb://127.0.0.1:27017/NewsDb", {
  useNewUrlParser: true
})
// In-memory data store
app.use(bodyParser.json());
// Middleware

app.use(bodyParser.urlencoded({
  extended: true
}));


const imageSchema = new mongoose.Schema({
  image: String,
});

const postSchema = mongoose.Schema({
  news_No: Number,
  banner_img: String,
  title: String,
  content: String,
  other_img: [imageSchema],
  img_caption : String,
  date : String
});

const counterSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0
  }
});

const CounterModel = mongoose.model('CounterModel', counterSchema);
const PostNews = mongoose.model("PostNews", postSchema);


// const upload = multer({ storage: storage })
// 1: GET All posts

app.get("/posts", async (req, res) => {

  try {
    const allPosts = await PostNews.find().lean();

    res.send(allPosts);

  } catch (error) {
    console.log(error);
    res.json({
      message: "Internal Server Error"
    });
  }

});



// 2: GET a specific post by id

app.get("/posts/:id",async(req,res)=>{

 const id = req.params.id;
 try {
  // Find the post by news_No
  const post = await PostNews.findOne({
    _id: id
  });

  if (!post) {
    return res.status(404).json({
      error: 'Post not found'
    });
  }

  res.json(post);
} catch (error) {
  console.error(error);
  res.status(500).send(error);
}

});

const today = new Date();
const day = today.getDate();
const month = today.getMonth() + 1;
const year = today.getFullYear();
const formattedDate = `${day}-${month}-${year}`;

// 3: POST a new post
app.post("/posts", async (req, res) => {

  // console.log(req.file,req.body);

  try {
    // Increment the counter before creating the new post
    const counter = await CounterModel.findOne();
    if (!counter) {
      // Create a counter document if it doesn't exist
      await CounterModel.create({
        count: 1
      });
    } else {
      // Increment the existing counter
      await CounterModel.updateOne({}, {
        $inc: {
          count: 1
        }
      });
    }

    // Create a new post with the incremented count
    const newPost = new PostNews({
      news_No: counter.count, // Use the incremented count as news_No
      banner_img: req.body.banner_img,
      img_caption : req.body.img_caption,
      title: req.body.title,
      content: req.body.content,
      // other_img: [imageSchema],
      date:formattedDate
    });

    await newPost.save();
    console.log("Successfully saved");
    res.status(200).json(newPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "An error occurred while saving the post."
    });
  }
});


// 4: PATCH a post when you just want to update one parameter
app.patch("/posts/:id", async (req, res) => {
  const id = req.params.id;

  console.log(id);

  try {
    // Find the post by news_No
    const post = await PostNews.findOne({
      _id: id
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    console.log(post);

    if (req.body.title) {
      post.title = req.body.title;
    }
    if (req.body.img_caption) {
      post.img_caption = req.body.img_caption;
    }
    if (req.body.content) {
      post.content = req.body.content;
    }


    // Save the updated post
    await post.save();

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});


// //CHALLENGE 5: DELETE a specific post by providing the post id.
app.delete("/posts/:id", async (req, res) => {

  try {
    const id = req.params.id;

    // Use findOneAndRemove with news_No
    const docDelete = await PostNews.findOneAndDelete({
      _id: id
    });

   // Get all remaining posts and update news_No accordingly
   const remainingPosts = await PostNews.find({}, '_id').sort({ news_No: 1 });

   for (let i = 0; i < remainingPosts.length; i++) {
     const postId = remainingPosts[i]._id;
     await PostNews.findByIdAndUpdate(postId, { $set: { news_No: i + 1 } });

   }
   console.log(remainingPosts.length);
   await CounterModel.updateOne({}, { count: remainingPosts.length+1});

   console.log("Successfully deleted and updated posts");
   res.status(200).json({ message: "Successfully deleted and updated posts" });
    } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }

});

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});