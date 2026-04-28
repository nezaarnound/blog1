import { Post, User, Like } from '../models/index.js';
import { createPostSchema } from '../utils/validation.js';
import { Op } from 'sequelize';

export const createPost = async (req, res) => {
  try {
    const validatedData = createPostSchema.parse(req.body);
    const { title, content } = validatedData;
    
    const post = await Post.create({
      title,
      content,
      authorId: req.user.id
    });
    
    const postWithAuthor = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'email'] }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: postWithAuthor
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows: posts } = await Post.findAndCountAll({
      include: [{ model: User, as: 'author', attributes: ['id', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      const likeCount = await Like.count({ where: { postId: post.id } });
      return { ...post.toJSON(), likesCount: likeCount };
    }));
    
    res.status(200).json({
      success: true,
      posts: postsWithLikes,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'email'] }]
    });
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const likeCount = await Like.count({ where: { postId: post.id } });
    
    res.status(200).json({
      success: true,
      post: { ...post.toJSON(), likesCount: likeCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }
    
    const validatedData = createPostSchema.parse(req.body);
    await post.update(validatedData);
    
    const updatedPost = await Post.findByPk(post.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'email'] }]
    });
    
    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: error.errors.map(e => e.message)
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    if (post.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }
    
    await post.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const existingLike = await Like.findOne({ where: { userId, postId } });
    
    if (existingLike) {
      await existingLike.destroy();
      const likeCount = await Like.count({ where: { postId } });
      await post.update({ likesCount: likeCount });
      
      res.status(200).json({
        success: true,
        message: 'Post unliked',
        likesCount: likeCount
      });
    } else {
      await Like.create({ userId, postId });
      const likeCount = await Like.count({ where: { postId } });
      await post.update({ likesCount: likeCount });
      
      res.status(200).json({
        success: true,
        message: 'Post liked',
        likesCount: likeCount
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const posts = await Post.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { content: { [Op.like]: `%${q}%` } }
        ]
      },
      include: [{ model: User, as: 'author', attributes: ['id', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    
    const postsWithLikes = await Promise.all(posts.map(async (post) => {
      const likeCount = await Like.count({ where: { postId: post.id } });
      return { ...post.toJSON(), likesCount: likeCount };
    }));
    
    res.status(200).json({
      success: true,
      count: postsWithLikes.length,
      posts: postsWithLikes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};