const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  age: Number,
  profileImg : {
    type: String,
    default: "default.jpg"
  },
  posts : [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts"
    }
  ]
});

module.exports = mongoose.model("Users", userSchema);
