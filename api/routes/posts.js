const router = require("express").Router();
const Post = require("../models/Post");
const verifyToken = require("../middleware/auth");

// CREATE A POST (Only logged-in users)
router.post("/", verifyToken, async (req, res) => {
    const newPost = new Post({ ...req.body, username: req.user.username });
    try {
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET A SINGLE POST
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found!");
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET ALL POSTS (With optional filters)
router.get("/", async (req, res) => {
    const username = req.query.user;
    const category = req.query.category;

    try {
        let posts;
        if (username) {
            posts = await Post.find({ username });
        } else if (category) {
            posts = await Post.find({ categories: { $in: [category] } });
        } else {
            posts = await Post.find();
        }
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json(err);
    }
});

// UPDATE POST (Only post owner can update)
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found!");

        if (post.username === req.user.username) {
            try {
                const updatedPost = await Post.findByIdAndUpdate(
                    req.params.id,
                    { $set: req.body },
                    { new: true }
                );
                res.status(200).json(updatedPost);
            } catch (err) {
                res.status(500).json(err);
            }
        } else {
            res.status(401).json("You can update only your post!");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// DELETE POST (Only post owner can delete)
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found!");

        if (post.username !== req.user.username) {
            return res.status(401).json("You can delete only your post!");
        }

        await Post.deleteOne({ _id: req.params.id });
        res.status(200).json("Post has been deleted...");
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
