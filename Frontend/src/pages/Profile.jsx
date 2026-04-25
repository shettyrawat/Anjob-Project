import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiEdit2, FiCheck, FiX, FiLock, FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { ButtonLoader } from '../components/Loader';
import { formatDate } from '../utils/dateUtils';

const Profile = () => {
    const { user, updateProfile, requestOTP, resetPassword } = useAuth();
    const [username, setUsername] = useState(user?.username || '');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Password Reset State
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user) {
            setUsername(user.username);
        }
    }, [user]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (username === user.username) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        try {
            await updateProfile(username);
            setMessage({ type: 'success', text: 'Username updated successfully!' });
            setIsEditing(false);
        } catch (err) {
            setMessage({ type: 'error', text: err || 'Failed to update username' });
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await requestOTP(user.email);
            setOtpSent(true);
            setMessage({ type: 'success', text: 'OTP sent to your email!' });
        } catch (err) {
            setMessage({ type: 'error', text: err || 'Failed to send OTP. Check your email config.' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            await resetPassword(user.email, otp, newPassword);
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setShowPasswordForm(false);
            setOtpSent(false);
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setMessage({ type: 'error', text: err || 'Invalid OTP or failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="loader">Loading...</div>;

    return (
        <div className="container fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <BackButton label="Back to Dashboard" to="/jobs" />
            <div className="glass-card" style={{ padding: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                    {user.profilePicture ? (
                        <>
                            <img
                                src={user.profilePicture}
                                alt="Profile"
                                referrerPolicy="no-referrer"
                                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div style={{ display: 'none', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent), var(--secondary))', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                                {user.username ? user.username[0].toUpperCase() : '?'}
                            </div>
                        </>
                    ) : (
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                            {user.username ? user.username[0].toUpperCase() : '?'}
                        </div>
                    )}
                    <div>
                        <h2 style={{ margin: 0 }}>Your Profile</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>Manage your account settings</p>
                    </div>
                </div>

                {message.text && (
                    <div className="slide-down" style={{ padding: '15px', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center', background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? '#22c55e' : '#ef4444', border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}` }}>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Email Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <FiMail /> Email Address
                        </label>
                        <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}>
                            {user.email}
                        </div>
                    </div>

                    {/* Username Update */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <FiUser /> Username
                        </label>
                        <div style={{ position: 'relative' }}>
                            {isEditing ? (
                                <form onSubmit={handleUpdate} style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="input-field"
                                        style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--accent)', color: 'var(--text-primary)', outline: 'none' }}
                                        autoFocus
                                    />
                                    <button type="submit" className="btn btn-primary" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={loading}>
                                        {loading ? <ButtonLoader /> : <FiCheck size={20} />}
                                    </button>
                                    <button type="button" onClick={() => { setIsEditing(false); setUsername(user.username); }} className="btn" style={{ padding: '10px', background: 'var(--bg-secondary)' }}>
                                        <FiX size={20} />
                                    </button>
                                </form>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                                    <span>{user.username}</span>
                                    <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '5px' }}>
                                        <FiEdit2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Password Change Section */}
                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        {!showPasswordForm ? (
                            <button onClick={() => setShowPasswordForm(true)} className="btn" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '14px' }}>
                                <FiLock /> Change Password
                            </button>
                        ) : (
                            <div className="slide-down" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Change Password</h3>
                                    <button onClick={() => { setShowPasswordForm(false); setOtpSent(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><FiX size={20} /></button>
                                </div>

                                {!otpSent ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>To ensure security, we will send an OTP to <strong>{user.email}</strong> before you can change your password.</p>
                                        <button onClick={handleRequestOTP} className="btn btn-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                                            {loading ? <><ButtonLoader /> Sending...</> : <><FiSend /> Send OTP</>}
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enter OTP</label>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                placeholder="6-digit code"
                                                className="input-field"
                                                style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Min 6 characters"
                                                className="input-field"
                                                style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                className="input-field"
                                                style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                                                required
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                                            {loading ? <><ButtonLoader /> Updating...</> : 'Update Password'}
                                        </button>
                                        <button type="button" onClick={handleRequestOTP} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer' }} disabled={loading}>
                                            Resend OTP
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Joined on {formatDate(user.createdAt)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Profile;
