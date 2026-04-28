import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendVerificationEmail = async (email, token) => {
  // ✅ HINDURA LINK: Ijya kuri FRONTEND (PORT 5500) aho kuba BACKEND
  const verificationUrl = `${process.env.FRONTEND_URL}/pages/verify.html?token=${token}`;
  
  const mailOptions = {
    from: `"Blog1 App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Kwemeza konti yawe - Blog1',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Murakaza neza kuri Blog1! 🎉</h2>
        <p>Urabashije kwiyandikisha. Kanda kuri link ikurikira kugirango ukemere ko konti yawe ari iya nyayo:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">✅ Kwemeza konti</a>
        <p>Cyangwa wandike link iyi muri browser yawe:</p>
        <p style="background: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">${verificationUrl}</p>
        <p><strong>⚠️ Icyitonderwa:</strong> Iyi link izakora mu masaha 24 gusa.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Niba utari wowe wiyandikishije, wirengagize ubu butumwa.</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
  console.log(`✅ Imeri yo kwemeza yoherejwe kuri: ${email}`);
};

export const sendResetPasswordEmail = async (email, token) => {
  // ✅ HINDURA LINK: Ijya kuri FRONTEND (PORT 5500)
  const resetUrl = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${token}`;
  
  const mailOptions = {
    from: `"Blog1 App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Guhindura ijambobanga - Blog1',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2196F3;">Guhindura ijambobanga ryawe 🔐</h2>
        <p>Wasabye guhindura ijambobanga ryawe. Kanda kuri link ikurikira:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">🔑 Hindura ijambobanga</a>
        <p>Cyangwa wandike link iyi:</p>
        <p style="background: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">${resetUrl}</p>
        <p><strong>⚠️ Icyitonderwa:</strong> Iyi link izakora mu minota 10 gusa.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Niba utari wowe wasabye guhindura ijambobanga, wirengagize ubu butumwa.</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
  console.log(`✅ Imeri yo guhindura ijambobanga yoherejwe kuri: ${email}`);
};