import * as brevo from '@getbrevo/brevo';

let apiInstance = null;

// Only initialize if API key exists
if (process.env.BREVO_API_KEY) {
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.ApiKeyKeys.API_KEY, process.env.BREVO_API_KEY);
}

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/pages/verify.html?token=${token}`;
  
  // If API key is not available, just log (for local development)
  if (!apiInstance) {
    console.log(`[EMAIL] Would send verification to: ${email}`);
    console.log(`[EMAIL] Link: ${verificationUrl}`);
    return;
  }
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "Blog1" };
  sendSmtpEmail.subject = 'Verify Your Email - Blog1';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
      <h2 style="color: #4CAF50;">Welcome to Blog1!</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}" style="background:#4CAF50; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Verify Email</a>
      <p>Or copy: ${verificationUrl}</p>
      <p>This link expires in 24 hours.</p>
    </div>
  `;
  
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Verification email sent to: ${email}`);
  } catch (error) {
    console.error('❌ Error sending email:', error.response?.body || error);
    throw error;
  }
};

export const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${token}`;
  
  // If API key is not available, just log (for local development)
  if (!apiInstance) {
    console.log(`[EMAIL] Would send reset to: ${email}`);
    console.log(`[EMAIL] Link: ${resetUrl}`);
    return;
  }
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: "Blog1" };
  sendSmtpEmail.subject = 'Reset Your Password - Blog1';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
      <h2 style="color: #2196F3;">Reset Your Password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background:#2196F3; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Reset Password</a>
      <p>Or copy: ${resetUrl}</p>
      <p>This link expires in 10 minutes.</p>
    </div>
  `;
  
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Reset email sent to: ${email}`);
  } catch (error) {
    console.error('❌ Error sending reset email:', error.response?.body || error);
    throw error;
  }
};