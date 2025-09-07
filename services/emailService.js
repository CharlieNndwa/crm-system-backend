// backend/services/emailService.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

console.log('EMAIL_USER:', process.env.EMAIL_USER); // Add this line
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Loaded' : 'Not Loaded'); // Add this line

const transporter = nodemailer.createTransport({
    service: 'Gmail', // Or your email service, e.g., 'SMTP'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendPasswordResetEmail = async (to, token) => {
    // Corrected URL for the frontend reset page
    const resetUrl = `https://crm-system-app.vercel.app/reset-password/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Password Reset Request',
        html: `
            <p>You requested a password reset</p>
            <p>Click this link to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link is valid for 1 hour.</p>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendPasswordResetEmail,
};