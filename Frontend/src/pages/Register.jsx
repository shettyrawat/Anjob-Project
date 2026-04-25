import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ButtonLoader } from '../components/Loader';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, verifyEmail, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await register(username, email, password);
            setIsVerifying(true);
        } catch (err) {
            setError(typeof err === 'string' ? err : (err?.response?.data?.message || err.message || 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verifyEmail(email, otp);
            setError('Email verified successfully! Please login now.'); // Using error state for success message feedback
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setError('');
        try {
            await resendOTP(email);
            // Optionally show a success toast or message
            setError('New OTP sent successfully!'); // Reusing error state for simple success feedback
        } catch (err) {
            setError(err?.response?.data?.message || err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card fade-in" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>
                {isVerifying ? 'Verify Email' : 'Register'}
            </h2>

            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '5px' }}>{error}</div>}

            {!isVerifying ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-field"
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                        {loading ? <><ButtonLoader /> Sending OTP...</> : 'Register'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={async credentialResponse => {
                                try {
                                    await googleLogin(credentialResponse.credential);
                                    navigate('/dashboard');
                                } catch (err) {
                                    setError(err);
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
                <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        We've sent a 6-digit code to <strong>{email}</strong>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label>Enter OTP</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="input-field"
                            placeholder="6-digit code"
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '8px' }}
                            maxLength={6}
                            required
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                        {loading ? <><ButtonLoader /> Verifying...</> : 'Verify & Register'}
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setIsVerifying(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
                        >
                            ← Back
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
                Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Login</Link>
            </p>
        </div>
    );
};
export default Register;
