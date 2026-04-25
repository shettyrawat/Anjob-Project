import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ButtonLoader } from '../components/Loader';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOTPMode, setIsOTPMode] = useState(false);
    const { login, verifyLogin, verifyEmail, resendOTP, googleLogin, requestLoginOTP } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(identifier, password);
            navigate('/dashboard');
        } catch (err) {
            if (typeof err === 'string') {
                setError(err);
            } else {
                const res = err?.response?.data;
                if (err?.response?.status === 403 && res?.email) {
                    setUnverifiedEmail(res.email);
                    setIsVerifying(true);
                    setError('Please verify your email to continue.');
                } else if (err?.response?.status === 404) {
                    setError('Account not found. Please register first.');
                } else {
                    setError(res?.message || err.message || 'Login failed');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyMode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verifyLogin(unverifiedEmail, otp);
            navigate('/dashboard');
        } catch (err) {
            try {
                // If verifyLogin failed, try verifyEmail (for unverified registrations)
                await verifyEmail(unverifiedEmail, otp);
                setError('Email verified! You can now login.');
                setIsVerifying(false);
                setOtp('');
            } catch (innerErr) {
                setError(typeof err === 'string' ? err : (err?.response?.data?.message || err.message || 'Verification failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOTPLoginRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await requestLoginOTP(identifier);
            setUnverifiedEmail(data.email);
            setIsVerifying(true);
            setOtp('');
            setError('A verification code has been sent to your email.');
        } catch (err) {
            setError(typeof err === 'string' ? err : (err?.response?.data?.message || 'Failed to send OTP'));
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setError('');
        try {
            await resendOTP(unverifiedEmail);
            setError('New OTP sent successfully!');
        } catch (err) {
            setError(err?.response?.data?.message || err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card fade-in" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>
                {isVerifying ? 'Verify OTP' : (isOTPMode ? 'OTP Login' : 'Login')}
            </h2>
            {error && <div style={{ color: error.includes('success') || error.includes('sent') ? 'var(--accent)' : 'var(--danger)', marginBottom: '1rem', textAlign: 'center', background: error.includes('success') || error.includes('sent') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '5px' }}>{error}</div>}

            {!isVerifying ? (
                <form onSubmit={isOTPMode ? handleOTPLoginRequest : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Email or Username</label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Enter email or username"
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            required
                        />
                    </div>
                    {!isOTPMode && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <label>Password</label>
                                <button
                                    type="button"
                                    onClick={() => setIsOTPMode(true)}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    Forgot Password? Login with OTP
                                </button>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                required
                            />
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                        {loading ? <><ButtonLoader /> Processing...</> : (isOTPMode ? 'Send Verification Code' : 'Login')}
                    </button>

                    {isOTPMode && (
                        <button
                            type="button"
                            onClick={() => setIsOTPMode(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Back to Password Login
                        </button>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={async credentialResponse => {
                                try {
                                    const data = await googleLogin(credentialResponse.credential);
                                    if (data.requiresOTP) {
                                        setUnverifiedEmail(data.email);
                                        setIsVerifying(true);
                                        setOtp('');
                                        setError('Verification code sent to your email.');
                                    } else if (data.isNewUser) {
                                        navigate('/set-password');
                                    } else {
                                        navigate('/dashboard');
                                    }
                                } catch (err) {
                                    setError(typeof err === 'string' ? err : 'Google Login Failed');
                                }
                            }}
                            onError={() => {
                                setError('Google Login Failed');
                            }}
                            useOneTap
                            theme="filled_black"
                            shape="pill"
                        />
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyMode} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        A verification code has been sent to <strong>{unverifiedEmail}</strong>. Enter it below to complete your login.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Verification Code</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="input-field"
                            placeholder="600000"
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '8px' }}
                            maxLength={6}
                            required
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                        {loading ? <><ButtonLoader /> Verifying...</> : 'Verify & Login'}
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsVerifying(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                        >
                            ← Back to Login
                        </button>
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={loading}
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', padding: 0 }}
                        >
                            Resend OTP
                        </button>
                    </div>
                </form>
            )}

            <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--accent)' }}>Register</Link>
            </p>
        </div>
    );
};

export default Login;
