const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Load env vars (Vercel me __dirname thik se na chale to yeh check karo)
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: "Invalid JSON format" });
    }
    next();
});
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            "http://localhost:5173",
            "https://donation-ms-frontend.vercel.app",
            "https://donation-ms-frontend-dg5ll58as-afzal-iqbals-projects.vercel.app"
        ];

        // Check if origin matches allowed list OR matches the Vercel preview pattern
        if (allowedOrigins.indexOf(origin) !== -1 || /^https:\/\/donation-ms-frontend.*\.vercel\.app$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Connect to MongoDB
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ DB Connection Error:", err));

// Import Routes
const authRoutes = require("../routes/web/authRoutes");
const donationRoutes = require("../routes/web/donationRoutes");
const campaignRoutes = require("../routes/web/campaignRoutes");
const adminRoutes = require("../routes/admin/adminRoutes");
const reviewRoutes = require("../routes/web/reviewRoutes");

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Root test route (optional)
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Export app for Vercel
module.exports = app;

// Local server start only if file run directly (local dev)
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
