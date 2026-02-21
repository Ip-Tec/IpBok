import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD?.replace(/\s+/g, ""),
  },
});

export const sendVerificationEmail = async (
  email: string,
  token: string,
  baseUrl?: string,
) => {
  const host = baseUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const confirmLink = `${host}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"IpBok Support" <support@ipbok.com>',
    to: email,
    subject: "Verify your IpBok Account",
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
    console.error("Error sending verification email:", error);
    throw new Error("Could not send verification email");
  }
};

/**
 * Send a password reset email.
 * @param to Recipient email address
 * @param token Reset token to embed in the link
 * @param baseUrl Optional base URL for the reset link
 */
export async function sendPasswordResetEmail(
  to: string,
  token: string,
  baseUrl?: string,
) {
  const host =
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  const resetUrl = `${host}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"IpBok Support" <support@ipbok.com>',
    to,
    subject: "Reset Your IpBok Password",
    text: `You requested a password reset for your IpBok account. Click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email. This link will expire in 1 hour.`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000000; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">IpBok</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #333333; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #666666; line-height: 1.6;">
            We received a request to reset the password for your IpBok account. No changes have been made to your account yet.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #0070f3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #666666; line-height: 1.6;">
            For security reasons, this link will expire in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email or contact support if you have concerns.
          </p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
          <p style="color: #999999; font-size: 12px;">
            If the button above doesn't work, copy and paste this URL into your browser:
          </p>
          <p style="color: #999999; font-size: 12px; word-break: break-all;">
            <a href="${resetUrl}" style="color: #0070f3;">${resetUrl}</a>
          </p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} IpBok. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Could not send password reset email");
  }
}

/**
 * Send a custom email from an admin.
 * @param to Recipient email address
 * @param subject Email subject
 * @param message Email message (HTML or text)
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  message: string,
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"IpBok Support" <support@ipbok.com>',
    to,
    subject,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000000; padding: 20px text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">IpBok</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="color: #333333; line-height: 1.6; white-space: pre-wrap;">
            ${message}
          </p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
          <p style="color: #999999; font-size: 12px; text-align: center;">
            This email was sent by an IpBok administrator.
          </p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} IpBok. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Custom admin email sent to ${to}`);
  } catch (error) {
    console.error("Error sending custom email:", error);
    throw new Error("Could not send custom email");
  }
}

/**
 * Send an invitation email to a new staff member.
 */
export async function sendStaffInvitationEmail(
  to: string,
  token: string,
  businessName: string,
  role: string,
  baseUrl?: string,
) {
  const host = baseUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${host}/signup?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"IpBok Support" <support@ipbok.com>',
    to,
    subject: `Invitation to join ${businessName} on IpBok`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000000; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">IpBok</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #333333; margin-top: 0;">Staff Invitation</h2>
          <p style="color: #666666; line-height: 1.6;">
            You have been invited to join <strong>${businessName}</strong> as a <strong>${role}</strong> on IpBok.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${inviteUrl}" style="background-color: #0070f3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Accept Invitation & Sign Up
            </a>
          </div>
          <p style="color: #666666; line-height: 1.6;">
            For security reasons, this invitation link will expire in <strong>50 minutes</strong>. If you did not expect this invitation, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
          <p style="color: #999999; font-size: 12px;">
            If the button above doesn't work, copy and paste this URL into your browser:
          </p>
          <p style="color: #999999; font-size: 12px; word-break: break-all;">
            <a href="${inviteUrl}" style="color: #0070f3;">${inviteUrl}</a>
          </p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} IpBok. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send a notification email to an existing user about their new role in a business.
 */
export async function sendStaffUpgradeEmail(
  to: string,
  businessName: string,
  role: string,
  baseUrl?: string,
) {
  const host = baseUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const dashboardUrl = `${host}/login`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"IpBok Support" <support@ipbok.com>',
    to,
    subject: `New Role Assigned at ${businessName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #000000; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">IpBok</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #333333; margin-top: 0;">Business Team Update</h2>
          <p style="color: #666666; line-height: 1.6;">
            Great news! You have been added to the team at <strong>${businessName}</strong> as a <strong>${role}</strong>.
          </p>
          <p style="color: #666666; line-height: 1.6;">
            You can now access the business dashboard by logging into your account.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${dashboardUrl}" style="background-color: #0070f3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
          <p style="color: #999999; font-size: 12px; text-align: center;">
            Thank you for being part of the IpBok network.
          </p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} IpBok. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
