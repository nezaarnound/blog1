import sequelize from '../config/database.js';
import User from './User.js';
import Post from './Post.js';
import Comment from './Comment.js';
import Like from './Like.js';
import Message from './Message.js';
import Image from './Image.js';

// ========== USER - POST RELATIONSHIPS ==========
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// ========== USER - COMMENT RELATIONSHIPS ==========
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ========== POST - COMMENT RELATIONSHIPS ==========
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// ========== USER - POST LIKES (Many-to-Many) ==========
User.belongsToMany(Post, { through: Like, foreignKey: 'userId', otherKey: 'postId', as: 'likedPosts' });
Post.belongsToMany(User, { through: Like, foreignKey: 'postId', otherKey: 'userId', as: 'likedBy' });

// ========== CHAT - MESSAGE RELATIONSHIPS ==========
// User can send many messages
User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId' });
// User can receive many messages
User.hasMany(Message, { as: 'receivedMessages', foreignKey: 'receiverId' });
// Message belongs to sender
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
// Message belongs to receiver
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });

// ========== IMAGE - POST RELATIONSHIPS ==========
// Post can have many images
Post.hasMany(Image, { foreignKey: 'postId', as: 'images' });
// Image belongs to one post
Image.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// ========== EXPORT ALL MODELS ==========
export { 
    sequelize, 
    User, 
    Post, 
    Comment, 
    Like, 
    Message, 
    Image 
};