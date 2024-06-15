const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const categoryRoute = require("./routes/categories");
const path = require("path");
const cors = require('cors');
const cloudinary = require('./config/cloudinary');
const multer = require("multer");

dotenv.config();
app.use(cors(
));
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "/images")));

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));





const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, req.body.name);
    },
});

const upload = multer({ storage: storage });

// app.post("/api/upload", upload.single("file"), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: 'No file uploaded' });
//     }
//     const x = await cloudinary.uploader.upload(req.file.path)
//     console.log("cloudniry", x)
//     res.status(200).json({ imageUrl: req.file.path });
// });
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error("No file path provided");
        }
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // File has been uploaded successfully
        console.log("File uploaded to Cloudinary: ", response.url);
        // Remove the local file
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        // Remove the local file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload failed: ", error.message);
        throw new Error("Cloudinary upload failed");
    }
};
app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const localFilePath = req.file.path;
        const cloudinaryResponse = await uploadOnCloudinary(localFilePath);

        if (cloudinaryResponse) {
            res.status(200).json({
                message: "File has been uploaded to Cloudinary",
                url: cloudinaryResponse.url,
            });
        } else {
            res.status(500).json({ message: "Failed to upload file to Cloudinary" });
        }
    } catch (error) {
        res.status(500).json({ message: "An error occurred during the upload process" });
    }
});







app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/posts', postRoute);
app.use('/api/categories', categoryRoute);

app.listen(5000, () => {
    console.log("Server is running at port 5000");
});