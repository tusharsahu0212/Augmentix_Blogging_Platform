const express = require("express");
const mongoose = require('mongoose');
const multer = require("multer");
const ejs = require("ejs");
const bodyParser = require("body-parser")

const app = express();

app.use(express.static("pubic"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/bharatInternBlogDB');

}

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
      },
    content: {
        type: String,
        required: true
      },
    image: Buffer,
    video: Buffer
}); 



const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
      },
    password: {
        type: String,
        required: true
      },
    blogs: [blogSchema]

  });

const Blog = mongoose.model('Blog', blogSchema);
const User = mongoose.model('User', userSchema);


const upload = multer({
    limits:{
        fileSize: 20*1024*1024
    }
});


const cpUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }])

app.get('/home', (req,res)=>{
    res.send("Home");
})



// create
app.post('/upload', cpUpload, async(req,res, next)=>{

    const title = req.body.title;
    const content = req.body.content;
    const imageBuffer = await req.files['image'][0].buffer;
    const videoBuffer = await req.files['video'][0].buffer;

    const newBlog = new Blog({
        title: title,
        content: content,
        image: imageBuffer,
        video: videoBuffer
    })

    await newBlog.save();

    res.status(200).send(req.body);

});

//read
app.get('/', (req,res)=>{

    Blog.find().then((data)=>{

    res.status(200).send(data);

      });
});

// update
app.post('/update',cpUpload, async(req, res)=>{

    const imageBuffer = await req.files['image'][0].buffer;
    const videoBuffer = await req.files['video'][0].buffer;

    Blog.updateOne({_id:req.body.id},{
        title: req.body.title,
        content: req.body.content,
        image: imageBuffer,
        video: videoBuffer
        
    }).then((data)=>{

        res.status(200).send("Blog Updated");
      
      });


});


app.listen(3000, () => {
    console.log("Server started on port 3000.");
})