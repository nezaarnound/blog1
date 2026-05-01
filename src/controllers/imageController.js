import { Image } from '../models/index.js';

// Get images for post
export const getPostImages = async (req, res) => {
    try {
        const { postId } = req.params;
        const images = await Image.findAll({ 
            where: { postId },
            order: [['createdAt', 'ASC']]
        });
        
        console.log(`✅ Found ${images.length} images for post ${postId}`);
        res.json({ success: true, images });
    } catch (error) {
        console.error('Error getting images:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete image
export const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await Image.findByPk(id);
        
        if (!image) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        
        await image.destroy();
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};