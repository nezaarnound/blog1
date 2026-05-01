import express from 'express';
import { protect } from '../middleware/auth.js';
import { Image, Post } from '../models/index.js';
import multer from 'multer';
import cloudinary from 'cloudinary';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

// Ensure uploads directory exists (for local storage fallback)
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

// Serve static images
router.use('/uploads', express.static('uploads'));

// ========== UPLOAD IMAGE (FILE) ==========
router.post('/upload', protect, upload.single('image'), async (req, res) => {
    try {
        const { postId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        
        if (post.authorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        let imageUrl = '';
        let publicId = `blog1_${Date.now()}_${Math.random()}`;
        
        // Try Cloudinary first if configured
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.v2.uploader.upload_stream(
                        { folder: 'blog1', public_id: publicId },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(req.file.buffer);
                });
                imageUrl = result.secure_url;
                publicId = result.public_id;
            } catch (cloudError) {
                console.error('Cloudinary error:', cloudError);
                // Fallback to local file
                imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            }
        } else {
            // Local file storage
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }
        
        const image = await Image.create({
            url: imageUrl,
            publicId: publicId,
            postId: postId
        });
        
        console.log('✅ Image uploaded:', image.id);
        res.status(201).json({ success: true, image });
        
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== UPLOAD IMAGE (URL) ==========
router.post('/upload-url', protect, async (req, res) => {
    try {
        const { postId, url } = req.body;
        
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        
        if (post.authorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        const image = await Image.create({
            url,
            postId,
            publicId: `blog1_url_${Date.now()}`
        });
        
        res.status(201).json({ success: true, image });
    } catch (error) {
        console.error('Error uploading image URL:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== GET IMAGES FOR POST ==========
router.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const images = await Image.findAll({ 
            where: { postId },
            order: [['createdAt', 'ASC']]
        });
        res.json({ success: true, images });
    } catch (error) {
        console.error('Error getting images:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== DELETE IMAGE ==========
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const image = await Image.findByPk(id);
        
        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        
        const post = await Post.findByPk(image.postId);
        if (post.authorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        // Delete file from disk if local
        if (image.publicId && !image.publicId.startsWith('blog1_url')) {
            const filePath = `./uploads/${image.publicId}`;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        await image.destroy();
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;