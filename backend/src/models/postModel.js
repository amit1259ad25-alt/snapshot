const mongoose =  require("mongoose")

const postSchema = new mongoose.Schema({
    img_url: String,
    caption: String,
    fileId: String,
})

const postModel = mongoose.model("posts" , postSchema);


module.exports = postModel;