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
        <h2 style="color: #4CAF50;">Welcome to Blog1!</h2>
        <p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>
        <p>Or copy: ${verificationUrl}</p>
        <hr>
        <p>If you didn't create an account, ignore this email.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to: ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
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
        <h2>Reset Your Password</h2>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p>Or copy: ${resetUrl}</p>
        <hr>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reset email sent to: ${email}`);
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw error;
  }
};