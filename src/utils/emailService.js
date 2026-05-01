import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/pages/verify.html?token=${token}`;
  
  const mailOptions = {
    from: `"Blog1" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Blog1',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Welcome to Blog1! 🎉</h2>
        <p>You have successfully registered. Click the link below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">${verificationUrl}</p>
        <p><strong>⚠️ Note:</strong> This link expires in 24 hours.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to: ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${token}`;
  
  const mailOptions = {
    from: `"Blog1" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - Blog1',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2196F3;">Reset Your Password 🔐</h2>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>Or copy and paste this link:</p>
        <p style="background: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">${resetUrl}</p>
        <p><strong>⚠️ Note:</strong> This link expires in 10 minutes.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${email}`);
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw error;
  }
};