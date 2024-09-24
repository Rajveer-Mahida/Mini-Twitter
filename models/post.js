const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    
    content: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Posts", postSchema);
