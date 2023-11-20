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
  img_caption: String,
  date: String
});

const counterSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0
  }
});


//for upcoming posts make a new database
const upcomingpostSchema = mongoose.Schema({
  news_No: Number,
  banner_img: String,
  title: String,
  content: String,
  other_img: [imageSchema],
  img_caption: String,
  date: String,
  postDate : String,
  postTime : String
});

const upcomingcounterSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0
  }
});

const ViewscounterSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0
  }
});

const MinDateTime = new mongoose.Schema({
  minDate:String,
  minTime: String
});

const adminSchema = new mongoose.Schema({
  admin_name: String,
  admin_id: String,
  admin_Pass: String,
  admin_img: String
});

const adminModel = mongoose.model('adminModel', adminSchema);

const CounterModel = mongoose.model('CounterModel', counterSchema);

const PostNews = mongoose.model("PostNews", postSchema);

const upcomingCounterModel = mongoose.model('upcomingCounterModel', upcomingcounterSchema);

const ViewsCounterModel = mongoose.model('ViewsCounterModel', ViewscounterSchema);

const minDateTime = mongoose.model('minDateTime', MinDateTime);

const upcomingPostNews = mongoose.model("upcomingPostNews", upcomingpostSchema);
// const upload = multer({ storage: storage })
// 1: GET All posts

app.get("/posts", paginatedResults(PostNews), async (req, res) => {

  res.json(res.paginatedResults);
});

// for upcoming post
app.get("/upcoming/posts",async (req, res) => {

  // res.json(res.paginatedResults);
  try {
    const allPosts = await upcomingPostNews.find().lean();

    res.send(allPosts);

  } catch (error) {
    console.log(error);
    res.json({
      message: "Internal Server Error"
    });
  }
});

// it is for only checking all posts time date
app.get("/upcoming/posts/dateTime",paginatedResults(upcomingPostNews),async (req, res) => {

  res.json(res.paginatedResults);
});

// 2: GET a specific post by id

app.get("/posts/:id", async (req, res) => {

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

// upcoming posts
app.get("/upcoming/posts/:id", async (req, res) => {

  const id = req.params.id;
  try {
    // Find the post by news_No
    const post = await upcomingPostNews.findOne({
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
  try {
    // Check if the request contains postDate and postTime
    if (req.body.postDate && req.body.postTime) {
      // Increment the upcoming post counter
      const upcounter = await upcomingCounterModel.findOne();
      if (!upcounter) {
        await upcomingCounterModel.create({ count: 1 });
      } else {
        await upcomingCounterModel.updateOne({}, { $inc: { count: 1 } });
      }

      // Define and set formattedDate
     
      // Create a new upcoming post
      const upnewPost = new upcomingPostNews({
        news_No: upcounter.count,
        banner_img: req.body.banner_img,
        img_caption: req.body.img_caption,
        title: req.body.title,
        content: req.body.content,
        date: formattedDate,
        postDate: req.body.postDate,
        postTime: req.body.postTime
      });

      await upnewPost.save();
      console.log("Successfully saved upcoming post");
      res.status(200).json(upnewPost);
    } else {
      // Increment the regular post counter
      const counter = await CounterModel.findOne();
      if (!counter) {
        await CounterModel.create({ count: 1 });
      } else {
        await CounterModel.updateOne({}, { $inc: { count: 1 } });
      }

      // Define and set formattedDate
      

      // Create a new regular post
      const newPost = new PostNews({
        news_No: counter.count,
        banner_img: req.body.banner_img,
        img_caption: req.body.img_caption,
        title: req.body.title,
        content: req.body.content,
        date: formattedDate
      });

      await newPost.save();
      console.log("Successfully saved regular post");
      res.status(200).json(newPost);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while saving the post." });
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
    if (req.body.banner_img) {
      post.banner_img = req.body.banner_img;
    }

    // Save the updated post
    await post.save();

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
//for upcoming news
app.patch("/upcoming/posts/:id", async (req, res) => {
  const id = req.params.id;

  console.log(id);

  try {
    // Find the post by news_No
    const post = await upcomingPostNews.findOne({
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
    if (req.body.postDate) {
      post.postDate = req.body.postDate;
    }
    if (req.body.postTime) {
      post.postTime = req.body.postTime;
    }
    if (req.body.img_caption) {
      post.img_caption = req.body.img_caption;
    }
    if (req.body.content) {
      post.content = req.body.content;
    }
    if (req.body.banner_img) {
      post.banner_img = req.body.banner_img;
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
    const remainingPosts = await PostNews.find({}, '_id').sort({
      news_No: 1
    });

    for (let i = 0; i < remainingPosts.length; i++) {
      const postId = remainingPosts[i]._id;
      await PostNews.findByIdAndUpdate(postId, {
        $set: {
          news_No: i + 1
        }
      });

    }
    console.log(remainingPosts.length);
    await CounterModel.updateOne({}, {
      count: remainingPosts.length + 1
    });

    console.log("Successfully deleted and updated posts");
    res.status(200).json({
      message: "Successfully deleted and updated posts"
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }

});
//for upcoming post
app.delete("/upcoming/posts/:id", async (req, res) => {

  try {
    const id = req.params.id;

    // Use findOneAndRemove with news_No
    const docDelete = await upcomingPostNews.findOneAndDelete({
      _id: id
    });

    // Get all remaining posts and update news_No accordingly
    const remainingPosts = await upcomingPostNews.find({}, '_id').sort({
      news_No: 1
    });

    for (let i = 0; i < remainingPosts.length; i++) {
      const postId = remainingPosts[i]._id;
      await upcomingPostNews.findByIdAndUpdate(postId, {
        $set: {
          news_No: i + 1
        }
      });

    }
    console.log(remainingPosts.length);
    await upcomingCounterModel.updateOne({}, {
      count: remainingPosts.length + 1
    });

    console.log("Successfully deleted and updated posts");
    res.status(200).json({
      message: "Successfully deleted and updated posts"
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }

});


// admin data
app.patch("/admin/posts", async (req, res) => {
  try {
    // Find the existing admin details
    const admin = await adminModel.findOne();

    if (!admin) {
      await adminModel.create({
        admin_name: "Admin",
        admin_id: "master12494290@admin.secure.self",
        admin_Pass: "12",
        admin_img: "image-not-found.jpg"
      });

    } else {
      // Update admin details if provided in the request body
      if (req.body.admin_name) {
        admin.admin_name = req.body.admin_name;
      }
      if (req.body.admin_id) {
        admin.admin_id = req.body.admin_id;
      }
      if (req.body.admin_Pass) {
        admin.admin_Pass = req.body.admin_Pass;
      }
      if (req.body.admin_img) {
        admin.admin_img = req.body.admin_img;
      }

      // Save the updated admin details
      await admin.save();

    }


    res.json(admin);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/admin/posts", async (req, res) => {

  try {
    const allPosts = await adminModel.find().lean();

    res.send(allPosts);

  } catch (error) {
    console.log(error);
    res.json({
      message: "Internal Server Error"
    });
  }

});

// MinDateTime collection
app.get("/mindatetime/posts", async (req, res) => {
  try {
    const allPosts = await minDateTime.find().lean();

    if (allPosts.length === 0) {
      // If there are no documents in the collection, insert a default value
      const defaultMinDateTime = new minDateTime({
        minDate: "2023-11-06",
        minTime: "12:00",
      });
      await defaultMinDateTime.save();
      res.send([defaultMinDateTime]);
    } else {
      res.send(allPosts);
    }
  } catch (error) {
    console.log(error);
    res.json({
      message: "Internal Server Error",
    });
  }
});

app.patch("/mindatetime/posts", async (req, res) => {
  try {
    const allPosts = await minDateTime.find();

    if (allPosts.length === 0) {
      // If there are no documents in the collection, insert a default value
      const defaultMinDateTime = new minDateTime({
        minDate: "2023-11-06",
        minTime: "12:00",
      });
      await defaultMinDateTime.save();
      res.json(defaultMinDateTime);
    } else {
      // Find the existing document (assuming there's only one)
      const existingMinDateTime = allPosts[0];

      // Update minDate and minTime if provided in the request body
      if (req.body.minDate) {
        existingMinDateTime.minDate = req.body.minDate;
      }
      if (req.body.minTime) {
        existingMinDateTime.minTime = req.body.minTime;
      }

      // Save the updated document
      await existingMinDateTime.save();

      res.json(existingMinDateTime);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// app.post("/admin/posts", async (req, res) => {

//   try {
//     // Increment the counter before creating the new post
//     const admin = await adminModel.findOne();
//     if(!admin){
//       await adminModel.create({
//         admin_name : "Admin",
//         admin_id : "master12494290@admin.secure.self",
//         admin_Pass : "",
//         admin_img : "image-not-found.jpg"
//       });
//     }else{
//       await adminModel.updateOne({
//         admin_name  : req.body.admin_name,
//         admin_id : req.body.admin_id,
//         admin_Pass : req.body.admin_Pass,
//         admin_img : req.body.admin_img
//       })
//     }
//     console.log("Successfully saved");
//     res.status(200).json(newPost);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       error: "An error occurred while saving the admin details."
//     });
//   }
// });



//pagination system
function paginatedResults(model) {
  return async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {};

    try {
      const totalDocuments = await model.countDocuments().exec();

      if (endIndex < totalDocuments) {
        results.next = {
          page: page + 1,
          limit: limit,
        };
      }

      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit,
        };
      }

      results.results = await model.find().limit(limit).skip(startIndex).exec();
      res.paginatedResults = results;
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}
//get counter model
app.get("/counter", async (req, res) => {
  try {
    const counter = await CounterModel.findOne();
    if (!counter) {
      // If there is no counter, you may want to handle this case accordingly
      res.status(404).json({ error: "Counter not found" });
    } else {
      res.json(counter);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/upcoming/counter", async (req, res) => {
  try {
    const counter = await upcomingCounterModel.findOne();
    if (!counter) {
      // If there is no counter, you may want to handle this case accordingly
      res.status(404).json({ error: "Counter not found" });
    } else {
      res.json(counter);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});



app.post("/Pageviews",async(req,res)=>{
  try {
    const  count = req.body.count; // Extract the count from the request body

    if (typeof count === 'undefined') {
      return res.status(400).send('Count is missing in the request body');
    }

    // Update the count in the ViewsCounterModel using Mongoose $set operator
    await ViewsCounterModel.updateOne({}, { $set: { count: count } });

    res.status(200).send('Count updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

app.get("/Pageviews", async (req, res) => {
  try {
    const counter = await ViewsCounterModel.findOne();
    if (!counter) {
      // If there is no counter, you may want to handle this case accordingly
      counter = await ViewsCounterModel.create({ count: 0 });
      // res.status(404).json({ error: "Counter not found" });
    } else {
      res.json(counter);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});


app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});