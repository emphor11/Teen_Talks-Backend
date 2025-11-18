const pool = require("../db")


const createUser = async(name,email,password) =>{
    const result = await pool.query(
        "INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING *",
        [name,email,password]
    )
    return result.rows[0]; // ✅ now has id, username, email
    
}

const findUserByEmail = async(email) =>{
    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
    )
    return result.rows[0];
}

const findUserById =async (id) =>{
    const result = await pool.query(
        "SELECT * FROM users WHERE id = $1", [id], 
    )
    return result.rows[0]
}

module.exports = {
    createUser,findUserByEmail,findUserById
}