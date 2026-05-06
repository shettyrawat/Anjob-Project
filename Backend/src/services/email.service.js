import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOTPEmail = async (email, otp, subject = 'Your Password Reset OTP', title = 'Password Reset Request') => {
    const isVerification = subject.toLowerCase().includes('verification');
    const mailOptions = {
        from: `"Anjob Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4f46e5;">${title}</h2>
                <p>Hello,</p>
                <p>${isVerification ? 'Welcome to Anjob! Please use the following 6-digit OTP to verify your email address and complete your registration.' : 'You requested to change your password. Use the following 6-digit OTP to verify your account.'} This code is valid for 10 minutes.</p>
                <div style="font-size: 32px; font-weight: bold; padding: 15px 30px; background: #f8fafc; border: 1px dashed #4f46e5; color: #4f46e5; border-radius: 8px; display: inline-block; margin: 25px 0; letter-spacing: 5px;">
                    ${otp}
                </div>
                <p>If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 12px; color: #666;">Best regards,<br /><strong>Anjob Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send OTP email');
    }
};
