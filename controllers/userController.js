const  pool  = require("../db");

const getUserById = async (req, res) => {
  try {
    const {userId} = req.params;
    console.log("userid",userId)

    const result = await pool.query(
      `SELECT id, name, email, created_at FROM users WHERE name = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: result.rows[0] });
    console.log("res",result)
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const profile_pic = async(req,res) =>{
  try {
    const imageUrl = req.file.path;
    console.log("img",imageUrl)
    await pool.query("UPDATE users SET profile_pic = $1 WHERE id = $2", [imageUrl, req.userId]);
    res.json({ success: true, profile_pic: imageUrl });
  } catch (err) {
    console.error("Profile Pic Upload Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getUserById,profile_pic };
