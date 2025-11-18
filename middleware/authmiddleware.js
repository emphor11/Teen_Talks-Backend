const jwt = require("jsonwebtoken")

const authMiddleware = async (req,res,next) =>{
    const token = req.header("Authorization")?.replace("Bearer ", "")
    console.log("Received Token:", token);

    if(!token){
        return res.status(400).json({message: "Invalid token"})
    }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        console.log("Decoded Token:", decoded);
        req.userId = decoded.id
        next()
    }catch(err){
        console.log("Error:", err)
        return res.status(401).json({ message: "Invalid or malformed token" });
    }
}

module.exports = authMiddleware