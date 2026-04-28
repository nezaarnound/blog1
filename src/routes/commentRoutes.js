import express from 'express';
import { 
  addComment, 
  getPostComments, 
  deleteComment,
  updateComment
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/post/:postId', getPostComments);

router.post('/', protect, addComment);
router.delete('/:id', protect, deleteComment);
router.put('/:id', protect, updateComment);

export default router;