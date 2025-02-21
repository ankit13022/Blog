const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcrypt");
const verifyToken = require("../middleware/auth");

// UPDATE USER
router.put("/:id", verifyToken, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ error: "Unauthorized! You can only update your account." });
        }

        // Secure Password Update
        if (req.body.password) {
            if (req.body.password.length < 6) {
                return res.status(400).json({ error: "Password must be at least 6 characters long!" });
            }
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        // Allow only specific fields to be updated
        const allowedUpdates = ["username", "email", "password", "profilePic"];
        const updates = {};
        for (let key of Object.keys(req.body)) {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: "Something went wrong!" });
    }
});

// DELETE USER
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ error: "Unauthorized! You can only delete your account." });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        await Post.deleteMany({ username: user.username });
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "User has been deleted..." });
    } catch (err) {
        res.status(500).json({ error: "Something went wrong!" });
    }
});

// GET USER (Public)
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        const { password, ...others } = user._doc;
        res.status(200).json(others);
    } catch (err) {
        res.status(500).json({ error: "Something went wrong!" });
    }
});

module.exports = router;
