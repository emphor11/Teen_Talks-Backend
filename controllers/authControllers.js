const pool = require("../db")

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body; // Google ID token from frontend

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, name, email, picture } = payload;

    // Check if user exists
    const existingUser = await findUserByEmail(email);

    let user;
    if (existingUser) {
      // Update Google ID if not already set
      if (!existingUser.google_id) {
        await pool.query(`UPDATE users SET google_id = $1 WHERE email = $2`, [google_id, email]);
      }
      user = existingUser;
    } else {
      // Create new user
      const newUser = await pool.query(
        `INSERT INTO users (name, email, google_id, profile_pic)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, profile_pic, google_id`,
        [name, email, google_id, picture]
      );
      user = newUser.rows[0];
    }

    // Generate JWT token for session
    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_pic: user.profile_pic,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ success: false, message: "Google login failed" });
  }
};

const { createUser, findUserByEmail, findUserById } = require("../models/User");

const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt");
const { getPostsByUserId } = require("../models/Post");


function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET);
  }

const signup = async (req, res) =>{
    try{
        const {name,email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                message: "Email and password required "
            })
        }
        const existingUser = await findUserByEmail(email);
        if (existingUser){
            return res.status(400).json({message: "User already existed"})
        }
        const hashedPassword = await bcrypt.hash(password, 12);

    // save new user
        const newUser = await createUser(name, email, hashedPassword);

        const token = generateToken(newUser.id);

        res.status(201).json({
        token,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
        },
        });


    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Server error" });
      }
    

}

const signin = async (req,res) =>{
    try{
    const {email,password} = req.body;

    if(!email || !password){
        return res.status(400).json({message: "Email and password required"})
    }
    const user = await findUserByEmail(email)
    if(!user){
        return res.status(400).json({message: "Invalid Credentials"})
    }
    const isMatch =await bcrypt.compare(password,user.password)
    if (!isMatch){
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id)
    const posts = await getPostsByUserId(user.id)
    console.log("Post", posts)
    console.log(user)
    return res.status(200).json({
        message: "Signed in successfully",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_pic: user.profile_pic
          // any other fields you want to expose
        },
        posts,
      });
    }catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error" });
}
}

const profile = async (req,res) => {
    try{
        const userId = req.userId
        if(!userId){
            return res.status(401).json({message: "Unauthorised"})
        }
        const user = await findUserById(userId)
        if(!user){
            return res.status(401).json({message: "User not found"})
        }
        res.json({ user})
    }catch(err){
        console.error("Profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
}



module.exports ={signup,signin,profile,googleLogin}