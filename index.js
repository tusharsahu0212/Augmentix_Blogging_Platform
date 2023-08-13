const express = require("express");
const mongoose = require('mongoose');
const multer = require("multer");
const ejs = require("ejs");
const bodyParser = require("body-parser")

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/bharatInternBlogDB');

}

let usernameSession = null;
let passwordSession = null;

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: Buffer,
        require: true
    },
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
    blogs: {
        type: [blogSchema],
        default: []
    }

});

const Blog = mongoose.model('Blog', blogSchema);
const User = mongoose.model('User', userSchema);


const upload = multer({
    limits: {
        fileSize: 20 * 1024 * 1024
    }
});


const cpUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }])

app.get('/home', (req, res) => {
    res.send("Home");
})



// create
app.post('/upload', cpUpload, async (req, res) => {

    let imageBuffer = null;
    let videoBuffer = null;

    if (req.body.image) {
        imageBuffer = await req.files['image'][0].buffer;

    }

    if (req.body.video) {
        videoBuffer = await req.files['video'][0].buffer;

    }

    const newBlog = new Blog({
        title: req.body.title,
        content: req.body.content,
        image: imageBuffer,
        video: videoBuffer
    })

    await newBlog.save();

    User.findOne({ username: req.body.username }).then((data, err) => {

        if (err) {
            console.log(err);
        } else {
            data.blogs.push(newBlog);
        }
        res.status(200).send(data);

    });


});

app.get('/upload',(req,res)=>{

    res.render('upload');
});

//read
app.get('/', (req, res) => {

    Blog.find().then((data) => {

        console.log(data);
        // res.status(200).send(data);
        res.render("home",{data:data});
    });

});

//My Blogs
app.post('/myBlogs', (req, res) => {


    User.findOne({ username: req.body.username }).then((data, err) => {

        // console.log(req.body)
        if (data) {
            res.status(200).send(data);
        } else {
            res.send(err);
        }

    });
});

app.get('/myBlogs',(req,res)=>{

    if(usernameSession==null && passwordSession==null){
        res.render("login",{ALERT:false});
    }

    User.findOne({ username: usernameSession, password: passwordSession }).then((data, err) => {

        // console.log(data);
        if (data) {

            res.render('myBlogs',{data:data.blogs});


        } else {
            console.log(err);
        
        }

    });

});

// update
app.put('/update', cpUpload, async (req, res) => {

    let imageBuffer = null;
    let videoBuffer = null;

    if (req.body.image) {
        imageBuffer = await req.files['image'][0].buffer;

    }

    if (req.body.video) {
        videoBuffer = await req.files['video'][0].buffer;

    }



    Blog.updateOne({ _id: req.body.id }, {
        title: req.body.title,
        content: req.body.content,
        image: imageBuffer,
        video: videoBuffer

    }).then((data) => {

        res.status(200).send("Blog Updated");

    });


});

//delete
app.delete('/delete', (req, res) => {

    Blog.deleteOne({ _id: req.body.id }).then((data) => {

        res.status(200).send(data);

    });

});

//signUp
app.post('/signUp', async (req, res) => {

    // console.log(req.body);
    User.find({ username: req.body.username }).then(async(data,err) => {

        if(data){

            res.render('signup',{ALERT:true});
            
        }else{
            const newUser = new User({

                username: req.body.username,
                password: req.body.password
            });
        
            await newUser.save();
        }

    });



});

//login
app.post('/login', (req, res) => {

    User.findOne({ username: req.body.username }).then((data, err) => {

        console.log(data);
        if (data) {

            if (data.password == req.body.password) {

                usernameSession = req.body.username;
                passwordSession = req.body.password;

                // res.render('myBlogs',{data:data.blogs});
                res.redirect('/myBlogs')
            } else {
                res.render('login',{message:"Incorrect Password!",ALERT:true});
            }
        } else {
            console.log(err);
            res.render('login',{message:"User Not Found!",ALERT:true});

        }

    });

});

// logout User
app.get('/logout',(req,res)=>{

    usernameSession = null;
    passwordSession = null;
    res.redirect('/');
});

// login page
app.get('/login',(req,res)=>{

    res.render('login',{ALERT:false});
});

//signup page
app.get('/signUp',(req,res)=>{

    res.render('signup',{ALERT:false});
});

app.listen(3000, () => {
    console.log("Server started on port 3000.");
})