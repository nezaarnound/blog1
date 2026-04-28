import express from 'express';
import { protect } from '../middleware/auth.js';
import { User } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all users except current user
router.get('/', protect, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        
        const users = await User.findAll({
            attributes: ['id', 'email', 'role'],
            where: {
                id: { [Op.ne]: currentUserId }
            }
        });
        
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: ['id', 'email', 'role']
        });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;