import express from 'express';
import { protect } from '../middleware/auth.js';
import { Image, Post } from '../models/index.js';

const router = express.Router();

// Upload image (store URL)
router.post('/upload', protect, async (req, res) => {
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
            publicId: `blog1_${Date.now()}`
        });

        res.status(201).json({ success: true, image });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get images for post
router.get('/post/:postId', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const images = await Image.findAll({ where: { postId } });
        res.json({ success: true, images });
    } catch (error) {
        console.error('Error getting images:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete image
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

        await image.destroy();
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;