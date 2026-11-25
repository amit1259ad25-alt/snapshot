const express = require("express")
const connectDB = require("./db/db.js")
const {uploadFile , deleteFile, updateFile} = require("./services/imagekit.js")
const multer = require("multer")
const postModel = require("./models/postModel.js")
const cors = require("cors");


const app = express();

app.use(cors())
app.use(express.json())
const upload = multer({storage: multer.memoryStorage(), limits:{ fileSize: 10 * 1024 * 1024 }})  ;

connectDB();


app.post("/posts",upload.single("image"), async (req,res) => {
 
    try{
         
    const result = await uploadFile(req.file.buffer);
    console.log(result);
    
        await postModel.create({
        img_url: result.url,
        caption: req.body.caption,
        fileId: result.fileId,
    })
    res.status(200).json({message: "post created succefully "});
    }
    catch(err) {
        console.log(err);
        
    }
})

app.get("/posts", async (req,res) => {
   try {
    const posts = await postModel.find();
    res.status(200).json({
        message: "posts fetched successfully ",
        posts,
    })
   }catch(err) {
    console.log(err);
    
   }
})

app.delete('/posts/:id', async (req,res) => {
    try{
        const id = req.params.id;
        const deletedPost = await postModel.findByIdAndDelete(id);

        if(!deletedPost){
            return res.status(404).json({message: "post not found"});
        }

        await deleteFile(deletedPost.fileId);

        res.status(200).json({
            message: "post and image deleted successufully !"
        })

    }catch(err){
        console.log(err);
        res.status(500).json({
            message: "failed to delete post",
        })
    }
})

app.patch('/posts/:id',upload.single("image"), async (req,res) => {
     try{

        const id = req.params.id;
        const existingPost = await postModel.findById(id);
        if(!existingPost){
            return res.status(404).json({ message: "post not found "});
        }
         // start with existing values or new caption if provided
         const updateData ={};
         if(req.body.caption !== undefined) {
             updateData.caption = req.body.caption;
         }

         // only call imageKit if a new image file was actually uploaded
         if(req.file) {
            let result;
            if(existingPost.fileId){
                result = await updateFile(existingPost.fileId, req.file.buffer);
            }
            else {
                // call your standard upload function instead;
                result = await uploadFile(req.file.buffer);
            }
            updateData.img_url = result.url;
            updateData.fileId = result.fileId;
         }
         // update mongodb and return the updated document( {new: true})
         const updatedPost = await postModel.findByIdAndUpdate(id, updateData, { new: true});

         res.status(200).json({
             message: "post updated successfully ! ",
             post : updatedPost
         })
     }catch(err){

        console.log(err);
        res.status(500).json({message: "failed to update post"})
        
     }
})


module.exports = app