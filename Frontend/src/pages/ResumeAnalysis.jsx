import { useState, useEffect } from 'react';
import { resumeService } from '../services/apiService';
import { FiUpload, FiFileText, FiAlertCircle, FiCheckCircle, FiArrowRight, FiSearch, FiDownload } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedResume from '../components/OptimizedResume';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { ButtonLoader } from '../components/Loader';


const ResumeAnalysis = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showOptimized, setShowOptimized] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState(null);

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
        if (targetRole.trim().length > 0) {
            const filtered = rolePresets.filter(r =>
                r.toLowerCase().includes(targetRole.toLowerCase())
            ).slice(0, 5); // Show top 5 suggestions
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [targetRole]);

    // Sync editable data when result changes
    useEffect(() => {
        if (result?.analysis?.optimizedData) {
            setEditableData(result.analysis.optimizedData);
        }
    }, [result]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.size <= 5 * 1024 * 1024) {
            setFile(selected);
            setError('');
        } else {
            setError('Please select a file smaller than 5MB');
        }
    };

    const handleUpload = async () => {
        if (!file || !targetRole.trim()) {
            setError('Please select a file and enter a target role/field');
            return;
        }
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('role', targetRole);

        try {
            const { data } = await resumeService.uploadResume(formData);
            setResult(data);
        } catch (err) {
            setError(err || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <BackButton to="/jobs" label="Back to Dashboard" />
            <h2 style={{ marginBottom: '2.5rem' }}>AI Resume Analysis</h2>

            <AnimatePresence mode="wait">
                {!result ? (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="glass-card"
                        style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
                    >
                        <div style={{ width: '100%', textAlign: 'left', marginBottom: '1rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>1. What role or field are you targeting?</h3>
                            <div style={{ marginBottom: '1rem', position: 'relative' }}>
                                <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="e.g. Registered Nurse, Site Engineer, Hotel Manager, Civil Engineer..."
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onFocus={() => targetRole.trim().length > 0 && setShowSuggestions(true)}
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
                                                        setTargetRole(s);
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
                                                    className="suggestion-item"
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
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginLeft: '0.5rem' }}>
                                AI will analyze your resume specifically for this field.
                            </p>
                        </div>

                        <div style={{ width: '100%', textAlign: 'left' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>2. Upload your Resume</h3>
                            <div style={{
                                border: '2px dashed var(--glass-border)',
                                padding: '2rem',
                                borderRadius: '16px',
                                textAlign: 'center',
                                background: 'rgba(255, 255, 255, 0.01)'
                            }}>
                                <div style={{ marginBottom: '1rem', color: 'var(--accent)' }}>
                                    <FiUpload size={32} />
                                </div>
                                <input
                                    type="file"
                                    id="resume-upload"
                                    hidden
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="resume-upload" className="btn" style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', padding: '10px 20px', cursor: 'pointer' }}>
                                    {file ? file.name : 'Choose File'}
                                </label>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.85rem' }}>Max file size 5MB (PDF or DOCX)</p>
                            </div>
                        </div>

                        {error && <p style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiAlertCircle size={16} /> {error}</p>}

                        <button
                            disabled={!file || !targetRole.trim() || loading}
                            onClick={handleUpload}
                            className="btn btn-primary"
                            style={{ minWidth: '240px', padding: '16px', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            {loading ? <><ButtonLoader /> Analyzing...</> : 'Start Comprehensive Analysis'}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}
                    >
                        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                            <h3>ATS Score</h3>
                            <div style={{ margin: '2rem auto', width: '150px', height: '150px', borderRadius: '50%', border: '8px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>
                                {result.analysis.atsScore}%
                            </div>
                            <p style={{ color: 'var(--text-secondary)' }}>Based on keyword matching for <strong>{targetRole}</strong>.</p>


                            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Keywords</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{result.analysis.keywordScore}/40</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(result.analysis.keywordScore / 40) * 100}%`, height: '100%', background: 'var(--accent)' }} />
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Formatting</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{result.analysis.formattingScore}/30</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(result.analysis.formattingScore / 30) * 100}%`, height: '100%', background: 'var(--accent)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="glass-card" style={{ padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Detected Skills</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                    {result.analysis.skills.map((skill, i) => (
                                        <span key={i} style={{ padding: '6px 14px', background: 'var(--bg-primary)', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--accent)', border: '1px solid var(--glass-border)' }}>
                                            {skill}
                                        </span>
                                    ))}
                                    {result.analysis.skills.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No skills detected.</p>}
                                </div>
                            </div>

                            <div className="glass-card" style={{ padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FiFileText size={20} color="var(--success)" /> Improvement Suggestions
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {result.analysis.suggestions.map((sg, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                            <FiCheckCircle size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <span>{sg}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button
                                        onClick={() => setResult(null)}
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid var(--accent)',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        Analyze Another <FiArrowRight size={18} />
                                    </button>
                                    {result.analysis.optimizedData && (
                                        <button
                                            onClick={() => setShowOptimized(true)}
                                            className="btn btn-primary"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        >
                                            <FiDownload size={18} /> Get Optimized PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Optimized Resume Modal/Overlay */}
                        <AnimatePresence>
                            {showOptimized && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="resume-preview-overlay"
                                    style={{
                                        position: 'fixed',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(0,0,0,0.9)',
                                        zIndex: 1000,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '40px',
                                        overflowY: 'auto',
                                        color: 'white'
                                    }}
                                >
                                    <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '20px', width: '100%', maxWidth: '800px', justifyContent: 'space-between' }}>
                                        <button
                                            onClick={() => setShowOptimized(false)}
                                            className="btn"
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}
                                        >
                                            <FiArrowRight style={{ transform: 'rotate(180deg)' }} /> Back to Analysis
                                        </button>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="btn"
                                                style={{
                                                    background: isEditing ? 'var(--success)' : 'var(--bg-primary)',
                                                    border: '1px solid var(--glass-border)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    color: 'white'
                                                }}
                                            >
                                                <FiFileText /> {isEditing ? 'Finish Editing' : 'Edit Resume'}
                                            </button>
                                            <button
                                                onClick={() => window.print()}
                                                className="btn btn-primary"
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <FiDownload /> Export PDF
                                            </button>
                                        </div>
                                    </div>
                                    <OptimizedResume
                                        data={editableData}
                                        isEditable={isEditing}
                                        onUpdate={(newData) => setEditableData(newData)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResumeAnalysis;

