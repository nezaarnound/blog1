 
import { z } from 'zod';

// Auth validation
export const registerSchema = z.object({
  email: z.string().email('Imeli ntagereranije neza'),
  password: z.string().min(6, 'Ijambobanga rigomba kuba ibyaha 6 byibuze')
});

export const loginSchema = z.object({
  email: z.string().email('Imeli ntagereranije neza'),
  password: z.string().min(1, 'Ijambobanga rirakenewe')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Imeli ntagereranije neza')
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Ijambobanga rigomba kuba ibyaha 6 byibuze')
});

// Post validation
export const createPostSchema = z.object({
  title: z.string().min(3, 'Umutwe ugomba kuba ibyaha 3 byibuze'),
  content: z.string().min(10, 'Ibigirirwa bigomba kuba ibyaha 10 byibuze')
});

// Comment validation
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Igitekerezo ntigishobora kuba ubusa'),
  postId: z.number().or(z.string()).transform(val => parseInt(val))
});

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Amakuru yoherejwe si yo',
        errors: error.errors.map(err => err.message)
      });
    }
  };
};