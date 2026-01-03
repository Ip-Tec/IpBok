require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // Fallback
const nodemailer = require('nodemailer');

async function verifyEmail() {
    console.log("--- Starting Email Verification ---");
    
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;
    
    console.log(`User: ${user}`);
    console.log(`Password (Raw): ${pass}`);
    
    if (!user || !pass) {
        console.error("❌ Missing environment variables!");
        return;
    }

    const sanitizedPass = pass.replace(/\s+/g, "");
    console.log(`Password (Sanitized): ${sanitizedPass}`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: sanitizedPass,
        },
    });

    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("✅ Connection Successful! Credentials are valid.");
        
        console.log("Sending test email...");
        const info = await transporter.sendMail({
            from: user,
            to: user, // Send to self
            subject: "Test Email from Verification Script",
            text: "If you see this, your email configuration is correct!",
        });
        console.log("✅ Email sent: ", info.messageId);
    } catch (error) {
        console.error("❌ Error:");
        console.error(error);
    }
}

verifyEmail();
