const { createPost, getAllPosts, getPostById, getPostsByUserId, } = require("../models/Post");
const path = require("path");

const addPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content && !req.file) {
      return res.status(400).json({ message: "Content or media required" });
    }

    // Use only the filename (req.file.filename) or relative path
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
    console.log(mediaUrl)
    const result = await createPost(req.userId, content, mediaUrl);

    // Send the post object with media URL
    res.status(201).json({
      message: "Post created successfully",
      post: result,
    });
  } catch (err) {
    console.error("Error creating post:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const getPost = async(req,res)=>{
    try{
        const result = await getAllPosts()
        console.log("res1",result)
        res.json(result)
    }catch(err){
        console.log("Error is", err)
        res.status(500).json({message: "Internal Server Error"})
    }
}

const fetchPostById = async (req, res) => {
    try {
      const post = await getPostById(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (err) {
      console.error("Fetch Post Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };

const getMyPost = async (req,res) =>{
  try{
    const post = await getPostsByUserId(req.userId)
    if (!posts) return res.status(404).json({ message: "Post not found" });
    res.json(posts)
  }catch(err){
    res.status(500).json({ message: "Server error" });
  }
}
  
module.exports = { addPost, getPost, fetchPostById ,getMyPost};