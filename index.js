const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const upload = require("./utils/multer");

// Models
const userModel = require("./models/user");
const postModel = require("./models/post");

//Middleware
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(cookieparser());

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).redirect("/login");
  }
  jwt.verify(
    token,
    "gTZo3FtM3RBFaFkkyzyC8Ifoc4t74trQ2XOM4KzchS",
    function (err, decoded) {
      if (err) {
        return res.status(401).send("Invalid token");
      }
      req.user = decoded;
    },
  );
  next();
}

function userAuthenticated(req, res, next) {
  const token = req.cookies.token;

  if (token) {
    // Verify the JWT token
    jwt.verify(token, "gTZo3FtM3RBFaFkkyzyC8Ifoc4t74trQ2XOM4KzchS", (err, decoded) => {
      if (!err) {
        // If the token is valid, redirect to profile
        return res.redirect("/profile");
      }
    });
  }
  // If no valid token, continue to the requested page
  next();
}


// Register Page
app.get("/",userAuthenticated, async (req, res) => {
  res.render("index");
});

// Handle Register  
app.post("/register", async (req, res) => {
  const { username, name, email, password, age } = req.body;
  if (!username || !name || !email || !password || !age) {
    return res.status(400).send("Please fill all the fields");
  }

  const user = await userModel.findOne({ email });

  if (user) {
    return res.status(400).send("User already registered");
  }

  bcrypt.hash(password, 10, async function (err, hash) {
    const user = await userModel.create({
      username,
      name,
      email,
      password: hash,
      age,
    });

    // console.log(user);
    res.redirect("/login");
  });
});

// Users
app.get("/users", async (req, res) => {
  const users = await userModel.find({});
  res.send(users);
});

// Login Page
app.get("/login",userAuthenticated, async (req, res) => {
  const token = req.cookies.token;
  if (token) {
    return res.status(200).redirect("/profile");
  }
  res.render("login");
});

// Handle Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Please fill Email and Password");
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).send("User not registered");
  }

  bcrypt.compare(password, user.password, function (err, result) {
    if (!result) {
      return res.status(400).send("Invalid Password");
    }

    const token = jwt.sign(
      { name: user.name, userId: user._id },
      "gTZo3FtM3RBFaFkkyzyC8Ifoc4t74trQ2XOM4KzchS",
    );
    res.cookie("token", token, { httpOnly: true, secure: true });
    res.redirect("/profile");
  });
});

// Handle Logout
app.get("/logout", async (req, res) => {
  res.clearCookie("token");
  res.status(200).redirect("/login");
});

// Profile
app.get("/profile", isLoggedIn, async (req, res) => {
  // Populate posts from the user model
  const user = await userModel.findById(req.user.userId).populate("posts");
  // console.log(user);
  res.render("Profile", { user });
});

// Create Post
app.post("/create-post", isLoggedIn, async (req, res) => {
  const user = await userModel.findById(req.user.userId);
  const { content } = req.body;
  const post = await postModel.create({
    content,
    user: user._id,
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

// Edit Page
app.get("/edit/:id", isLoggedIn, async (req, res) => {
  const id = req.params.id;
  const post = await postModel.findById(id);
  res.render("edit", { post });
});

//edit-post
app.post("/edit/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content },
  );
  res.redirect("/profile");
});

// Delete Post
app.get("/delete/:id", async (req, res) => {
  const id = req.params.id;
  const post = await postModel.findByIdAndDelete(id);
  res.redirect("/profile");
});

// Mullter

app.get("/profile/upload", (req, res) => {
  res.render("upload");
});

app.post(
  "/profile/upload",
  isLoggedIn,
  upload.single("image"),
  async (req, res) => {
    const user = await userModel.findById(req.user.userId);
    user.profileImg = req.file.filename;
    await user.save();
    res.redirect("/profile");
  },
);

// Database Connection
mongoose
  .connect(
    "mongodb+srv://rajveer:NhFpOcBOhrZRv3fb@sheryians.jkmoznc.mongodb.net/mini-project-1?retryWrites=true&w=majority",
  )
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => console.error("Could not connect to MongoDB...", err));
