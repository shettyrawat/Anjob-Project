import app from './app.js';
import connectDB from './config/db.js';
import dns from 'dns';

// Fix for Render IPv6 ENETUNREACH error with Nodemailer
dns.setDefaultResultOrder('ipv4first');


const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
