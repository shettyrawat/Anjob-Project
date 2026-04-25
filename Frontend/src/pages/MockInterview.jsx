import { useState, useEffect, useRef } from 'react';
import { interviewService } from '../services/apiService';
import { FiMessageSquare, FiMic, FiPlay, FiCheckCircle, FiArrowRight, FiStar, FiSlash, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { ButtonLoader } from '../components/Loader';


const MockInterview = () => {
    const [session, setSession] = useState(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [mode, setMode] = useState('text');
    const [isAdaptive, setIsAdaptive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const scrollRef = useRef(null);

    const rolePresets = [
        // IT / Tech
        'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
        'React Developer', 'Node.js Developer', 'Python Developer', 'Java Developer',
        'DevOps Engineer', 'Cloud Architect', 'Data Scientist', 'AI/ML Engineer',
        'Cyber Security Analyst', 'UI/UX Designer', 'Mobile App Developer', 'QA Engineer',
        // Medical / Healthcare
        'Registered Nurse', 'Pharmacist', 'General Physician', 'Dentist', 'Medical Lab Technician',
        'Radiologist', 'Therapist', 'Healthcare Administrator',
        // Engineering / Construction
        'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Site Engineer',
        'Project Manager', 'Architect', 'Interior Designer', 'Structural Engineer',
        // Business / Finance
        'Accountant', 'Financial Analyst', 'Marketing Manager', 'Sales Executive',
        'HR Manager', 'Business Analyst', 'Operations Manager', 'Bank Manager',
        // Others
        'Teacher', 'Chef', 'Hotel Manager', 'Content Writer', 'Graphic Designer',
        'Customer Support', 'Lawyer', 'Data Analyst'
    ];

    useEffect(() => {
        if (role.trim().length > 0) {
            const filtered = rolePresets.filter(r =>
                r.toLowerCase().includes(role.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [role]);

    // Speech-to-Text Setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (typeof window !== 'undefined' && SpeechRecognition) {
            try {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'en-US'; // Set default language

                recognitionRef.current.onresult = (event) => {
                    const transcript = Array.from(event.results)
                        .map(result => result[0])
                        .map(result => result.transcript)
                        .join('');
                    setAnswer(transcript);
                };

                recognitionRef.current.onerror = (event) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'not-allowed') {
                        alert('Microphone access denied. Please allow microphone permissions in your browser settings.');
                    }
                    setIsRecording(false);
                };

                recognitionRef.current.onend = () => {
                    setIsRecording(false);
                };
            } catch (err) {
                console.error('Failed to initialize Speech Recognition', err);
            }
        }
    }, []);

    // Text-to-Speech helper
    const speakQuestion = (text) => {
        if ('speechSynthesis' in window && mode === 'voice') {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser or requires a secure (HTTPS) connection. Please use Google Chrome or Edge.');
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            try {
                setAnswer('');
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error('Mic start error:', err);
                setIsRecording(false);
                if (err.name === 'NotAllowedError') {
                    alert('Microphone permission denied.');
                }
            }
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [session?.chatHistory]);

    const startSession = async () => {
        if (!role.trim()) return;
        setLoading(true);
        try {
            const { data } = isAdaptive
                ? await interviewService.startAdaptiveInterview({ role, mode })
                : await interviewService.startInterview({ role, mode });
            setSession(data);
            setCurrentIdx(0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!answer) return;
        setLoading(true);
        if (isRecording) recognitionRef.current.stop();

        try {
            const { data } = isAdaptive
                ? await interviewService.submitAdaptiveAnswer(session._id, { answer })
                : await interviewService.submitAnswer(session._id, { questionIndex: currentIdx, answer });

            setSession(data);
            setAnswer('');
            if (!isAdaptive && currentIdx < data.questions.length - 1) {
                setCurrentIdx(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentQuestion = () => {
        if (!session) return '';
        if (isAdaptive) {
            const lastAI = [...session.chatHistory].reverse().find(h => h.role === 'assistant');
            return lastAI?.content || '';
        }
        return session.questions[currentIdx]?.question;
    };

    useEffect(() => {
        if (session && session.status !== 'completed') {
            if (isAdaptive) {
                const q = getCurrentQuestion();
                if (q) speakQuestion(q);
            } else {
                speakQuestion(session.questions[currentIdx].question);
            }
        }
    }, [currentIdx, session?.chatHistory?.length]);

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <BackButton to="/jobs" label="Back to Dashboard" />
            <h2 style={{ marginBottom: '2.5rem' }}>AI Mock Interview</h2>

            <AnimatePresence mode="wait">
                {!session ? (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="glass-card" style={{ padding: '3rem' }}
                    >
                        <h3 style={{ marginBottom: '1.5rem' }}>What role are you interviewing for?</h3>

                        <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
                            <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder="e.g. Software Engineer, Registered Nurse, Project Manager..."
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                onFocus={() => role.trim().length > 0 && setShowSuggestions(true)}
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 2.8rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem'
                                }}
                            />

                            {/* Auto-suggestions Dropdown */}
                            <AnimatePresence>
                                {showSuggestions && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        style={{
                                            position: 'absolute',
                                            top: '110%',
                                            left: 0, right: 0,
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '12px',
                                            zIndex: 100,
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {suggestions.map((s, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setRole(s);
                                                    setShowSuggestions(false);
                                                }}
                                                style={{
                                                    padding: '12px 16px',
                                                    cursor: 'pointer',
                                                    borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid var(--glass-border)',
                                                    textAlign: 'left',
                                                    transition: 'background 0.2s ease',
                                                    fontSize: '0.95rem'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                            >
                                                {s}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>



                        <h3 style={{ marginBottom: '1.5rem' }}>Interview Type</h3>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                            <button
                                onClick={() => setIsAdaptive(false)}
                                className="btn"
                                style={{ flex: 1, padding: '15px', background: !isAdaptive ? 'var(--accent)' : 'var(--bg-primary)', color: !isAdaptive ? 'white' : 'var(--text-primary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                            >
                                <FiSlash size={20} /> Static (10 Questions)
                            </button>
                            <button
                                onClick={() => setIsAdaptive(true)}
                                className="btn"
                                style={{ flex: 1, padding: '15px', background: isAdaptive ? 'var(--accent)' : 'var(--bg-primary)', color: isAdaptive ? 'white' : 'var(--text-primary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                            >
                                <FiPlay size={20} /> Adaptive (Conversational)
                            </button>
                        </div>

                        <h3 style={{ marginBottom: '1.5rem' }}>Input Mode</h3>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                            <button
                                onClick={() => setMode('text')}
                                className="btn"
                                style={{ flex: 1, padding: '15px', background: mode === 'text' ? 'var(--accent)' : 'var(--bg-primary)', color: mode === 'text' ? 'white' : 'var(--text-primary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                            >
                                <FiMessageSquare size={20} /> Text Mode
                            </button>
                            <button
                                onClick={() => setMode('voice')}
                                className="btn"
                                style={{ flex: 1, padding: '15px', background: mode === 'voice' ? 'var(--accent)' : 'var(--bg-primary)', color: mode === 'voice' ? 'white' : 'var(--text-primary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                            >
                                <FiMic size={20} /> Voice Mode
                            </button>
                        </div>

                        <button
                            disabled={!role || loading}
                            onClick={startSession}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '1.1rem' }}
                        >
                            {loading ? <><ButtonLoader /> Initializing...</> : <><FiPlay size={20} /> Start Interview</>}
                        </button>
                    </motion.div>
                ) : session.status === 'completed' ? (
                    <motion.div
                        key="finished"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}
                    >
                        <div style={{ padding: '2rem', borderRadius: '50%', background: 'var(--success)', color: 'white', width: 'fit-content', margin: '0 auto 2rem' }}>
                            <FiCheckCircle size={48} />
                        </div>
                        <h2>Interview Completed!</h2>
                        <div style={{ margin: '3rem 0', display: 'flex', justifyContent: 'center', gap: '4rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Overall Score</p>
                                <h1 style={{ fontSize: '3.5rem', color: 'var(--accent)' }}>{session.overallScore}/10</h1>
                            </div>
                        </div>

                        <div style={{ textAlign: 'left', marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <FiStar color="var(--accent)" /> Detailed Review
                            </h3>
                            {session.questions.map((q, i) => (
                                <div key={i} className="glass-card" style={{ padding: '1.5rem', background: 'var(--bg-primary)', marginBottom: '1rem' }}>
                                    <h4 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Q{i + 1}: {q.question}</h4>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your Answer:</p>
                                        <p style={{ fontSize: '1rem', fontStyle: 'italic' }}>"{q.answer}"</p>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--success)' }}>AI Feedback:</p>
                                            <p style={{ fontSize: '0.9rem' }}>{q.feedback}</p>
                                        </div>
                                        <div>
                                            {q.modelAnswer && (
                                                <div style={{ background: 'var(--bg-secondary)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid var(--success)' }}>
                                                    <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--success)' }}>Model Answer:</p>
                                                    <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>{q.modelAnswer}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setSession(null)} className="btn btn-primary" style={{ marginTop: '3rem', padding: '14px 40px' }}>
                            Finalize & Exit
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="room">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {isAdaptive ? 'Adaptive Conversational Mode' : `Question ${currentIdx + 1} of ${session.questions.length}`}
                            </span>
                        </div>

                        {isAdaptive ? (
                            <div className="glass-card" style={{ padding: '1.5rem', height: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }} ref={scrollRef}>
                                {session.chatHistory.map((h, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={i}
                                        style={{
                                            alignSelf: h.role === 'assistant' ? 'flex-start' : 'flex-end',
                                            maxWidth: '85%',
                                            padding: '1rem',
                                            borderRadius: '16px',
                                            background: h.role === 'assistant' ? 'var(--bg-primary)' : 'var(--accent)',
                                            color: h.role === 'assistant' ? 'var(--text-primary)' : 'white',
                                            border: h.role === 'assistant' ? '1px solid var(--glass-border)' : 'none'
                                        }}>
                                        <p style={{ fontSize: '0.95rem', margin: 0 }}>{h.content}</p>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <ButtonLoader /> AI is thinking...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.4rem', lineHeight: '1.6' }}>{session.questions[currentIdx].question}</h3>
                            </div>
                        )}

                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: '500' }}>Your Answer</span>
                                {mode === 'voice' && (
                                    <button onClick={toggleRecording} style={{ padding: '8px 16px', borderRadius: '20px', background: isRecording ? '#ff4757' : 'var(--bg-primary)', color: isRecording ? 'white' : 'var(--text-primary)', border: 'none', cursor: 'pointer' }}>
                                        {isRecording ? 'Listening...' : 'Speak Response'}
                                    </button>
                                )}
                            </div>
                            <textarea
                                rows="4"
                                placeholder="State your answer clearly..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                style={{ width: '100%', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'none', marginBottom: '1.5rem' }}
                            />
                            <button
                                disabled={!answer || loading}
                                onClick={submitAnswer}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                {loading ? <><ButtonLoader /> Processing...</> : 'Submit Answer'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MockInterview;
