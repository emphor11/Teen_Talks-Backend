const { addComment, getCommentsByPost, deleteComment } = require("../models/Comments");


const createComment= async(req,res)=>{
    try{
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const result = await addComment(req.userId, postId, content);
    res.status(201).json(result);
    }catch(err){
    console.error("Comment Add Error:", err);
    res.status(500).json({ message: "Server error" });
    }
}


const fetchComments = async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await getCommentsByPost(postId);
      res.json(comments);
    } catch (err) {
      console.error("Fetch Comments Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };

  const removeComment = async (req, res) => {
    try {
      const { commentId } = req.params;
      const deleted = await deleteComment(commentId, req.user.id);
  
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found or unauthorized" });
      }
  
      res.json({ message: "Comment deleted successfully" });
    } catch (err) {
      console.error("Delete Comment Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  module.exports = { createComment, fetchComments, removeComment };