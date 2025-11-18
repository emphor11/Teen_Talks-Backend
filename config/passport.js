const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../db"); // or your ORM

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // check if user exists
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        let user;
        if (result.rows.length === 0) {
          const insert = await pool.query(
            "INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING *",
            [name, email, profile.id]
          );
          user = insert.rows[0];
        } else {
          user = result.rows[0];
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
