
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD?.replace(/\s+/g, ""),
  },
});

export const sendVerificationEmail = async (email: string, token: string, baseUrl?: string) => {
  const host = baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const confirmLink = `${host}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"IpBok Support" <support@ipbok.com>',
    to: email,
    subject: 'Verify your IpBok Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to IpBok!</h2>
        <p>Please click the link below to verify your email address and activate your account:</p>
        <p>
          <a href="${confirmLink}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">
          Link: <a href="${confirmLink}">${confirmLink}</a>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Could not send verification email');
  }
};
