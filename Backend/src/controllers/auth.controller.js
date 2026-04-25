import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import { sendOTPEmail } from '../services/email.service.js';
import { validateEmailDomain } from '../utils/emailValidator.js';
import { generateOTP } from '../utils/otpGenerator.js';
import { generateToken } from '../utils/tokenGenerator.js';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { sub, email, name, picture } = ticket.getPayload();

        // Check if user exists
        let user = await User.findOne({ email });
        let isNewUser = false;

        // Upload profile picture to Cloudinary if it's from Google and not already uploaded
        let cloudinaryUrl = picture;
        if (picture) {
            try {
                const uploadRes = await cloudinary.uploader.upload(picture, {
                    folder: 'profile_pictures',
                    public_id: `google_${sub}`,
                    overwrite: true
                });
                cloudinaryUrl = uploadRes.secure_url;
            } catch (err) {
                console.error('Cloudinary upload failed for profile picture:', err);
                // Fallback to original picture URL
            }
        }

        if (user) {
            // Update googleId and profilePicture
            user.googleId = sub || user.googleId;
            user.profilePicture = cloudinaryUrl || user.profilePicture;
            await user.save();
        } else {
            // Do NOT create new user, just return 404
            return res.status(404).json({ message: 'Account not found. Please register first.' });
        }

        // Generate 6-digit Login OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.loginOTP = otp;
        user.loginOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send Login OTP email
        await sendOTPEmail(user.email, otp, 'Login Verification Code', 'Google Login Attempt');

        res.json({
            message: 'Login OTP sent to your email.',
            requiresOTP: true,
            email: user.email,
            isNewUser
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend Verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        // Generate 6-digit Verification OTP
        const otp = generateOTP();

        user.verificationOTP = otp;
        user.verificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send verification email
        await sendOTPEmail(email, otp, 'Verify your Anjob Account', 'Welcome to Anjob!');

        res.json({ message: 'Verification OTP resent to your email' });
    } catch (error) {
        next(error);
    }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        console.log('Registration request received:', req.body);
        const { username, email, password } = req.body;

        // Check if user exists (email or username)
        const userExists = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        // Validate email domain
        const validationResult = await validateEmailDomain(email);
        if (!validationResult.valid) {
            return res.status(400).json({ message: validationResult.message });
        }

        // Generate 6-digit Verification OTP
        const otp = generateOTP();

        // Create user (unverified)
        const user = await User.create({
            username,
            email,
            password,
            isVerified: false,
            verificationOTP: otp,
            verificationOTPExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        if (user) {
            try {
                // Send verification email
                await sendOTPEmail(email, otp, 'Verify your Anjob Account', 'Welcome to Anjob!');

                res.status(201).json({
                    message: 'Registration initiated. Please verify your email with the OTP sent.',
                    email: user.email
                });
            } catch (emailError) {
                // If email fails, delete the created user to avoid blocking the email/username
                await User.findByIdAndDelete(user._id);
                console.error('Failed to send registration email, user document removed:', emailError);
                return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
            }
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email }).select('+verificationOTP +verificationOTPExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        if (user.verificationOTP !== otp || user.verificationOTPExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Mark as verified
        user.isVerified = true;
        user.verificationOTP = undefined;
        user.verificationOTPExpires = undefined;
        await user.save();

        res.json({
            message: 'Email verified successfully! You can now login.',
            isVerified: true
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user (Step 1: Password Check)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        console.log('Login request received:', req.body);
        const { identifier, password } = req.body;

        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        }).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'Account not found. Please register first.' });
        }

        if (await user.matchPassword(password)) {
            // Check if verified (initial registration verification)
            if (!user.isVerified && user.password) {
                return res.status(403).json({
                    message: 'Please verify your email before logging in.',
                    isVerified: false,
                    email: user.email
                });
            }

            // Direct login with password (no OTP required anymore)
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Request Login OTP (For users who forgot password)
// @route   POST /api/auth/request-login-otp
// @access  Public
export const requestLoginOTP = async (req, res, next) => {
    try {
        const { identifier } = req.body;

        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'Account not found. Please register first.' });
        }

        // Generate 6-digit Login OTP
        const otp = generateOTP();
        user.loginOTP = otp;
        user.loginOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send Login OTP email
        await sendOTPEmail(user.email, otp, 'Login Verification Code', 'OTP Login Attempt');

        res.json({
            message: 'A verification code has been sent to your email.',
            email: user.email
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify Login OTP (Step 2: Token Generation)
// @route   POST /api/auth/verify-login
// @access  Public
export const verifyLoginOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email }).select('+loginOTP +loginOTPExpires');

        if (!user || user.loginOTP !== otp || user.loginOTPExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired login OTP' });
        }

        // Clear login OTP after successful verification
        user.loginOTP = undefined;
        user.loginOTPExpires = undefined;
        await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.username = req.body.username || user.username;

            // If someone tries to change password here, they can, but the request body needs to have it
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                profilePicture: updatedUser.profilePicture,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Request Password Reset OTP (Forgot Password)
// @route   POST /api/auth/request-otp
// @access  Public
export const requestPasswordOTP = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Generate 6-digit OTP
        const otp = generateOTP();

        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        await sendOTPEmail(user.email, otp);

        res.json({ message: 'Password reset OTP sent to your email' });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password using OTP
// @route   PUT /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordExpires');

        if (!user || user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (error) {
        next(error);
    }
};