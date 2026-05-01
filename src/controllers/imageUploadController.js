import cloudinary from 'cloudinary';
import multer from 'multer';
import { Image, Post } from '../models/index.js';

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

export const uploadImage = async (req, res) => {
    try {
        const { postId } = req.body;
        
        console.log('Uploading image for post:', postId);
        console.log('File:', req.file);
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.v2.uploader.upload_stream(
                {
                    folder: 'blog1',
                    resource_type: 'image'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });
        
        console.log('Cloudinary upload result:', result.secure_url);
        
        // Save image URL to database
        const image = await Image.create({
            url: result.secure_url,
            publicId: result.public_id,
            postId: postId
        });
        
        console.log('Image saved to database:', image.id);
        
        res.status(201).json({ success: true, image });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const upload = upload.single('image');