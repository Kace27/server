"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const playerRoutes_1 = __importDefault(require("./routes/playerRoutes"));
const rankingRoutes_1 = __importDefault(require("./routes/rankingRoutes"));
const matchRoutes_1 = __importDefault(require("./routes/matchRoutes"));
const playerController_1 = require("./controllers/playerController");
const rankingController_1 = require("./controllers/rankingController");
const auth_1 = require("./middlewares/auth");
const errorHandler_1 = require("./middlewares/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Enable CORS
app.use((0, cors_1.default)());
// Parse JSON request bodies
app.use(express_1.default.json());
// Public API routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/players', playerRoutes_1.default);
app.use('/api/ranking', rankingRoutes_1.default);
app.use('/api/matches', matchRoutes_1.default);
// Admin Routes (Directly matching specified endpoints)
app.put('/api/admin/players/:id/status', auth_1.authMiddleware, playerController_1.updatePlayerStatus);
app.post('/api/admin/cron/refresh-ranking', auth_1.authMiddleware, rankingController_1.triggerRefreshRanking);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
// Global Error Handler
app.use(errorHandler_1.errorHandler);
const rankingService_1 = require("./services/rankingService");
// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode.`);
    // Auto-refresh ranking cache every 5 minutes (300,000 ms)
    setInterval(() => {
        console.log('Running automatic ranking cache refresh...');
        (0, rankingService_1.refreshRankingCache)().catch(err => console.error('Auto-refresh failed:', err));
    }, 5 * 60 * 1000);
    // Run it once on startup (optional, but good for immediate consistency)
    (0, rankingService_1.refreshRankingCache)().catch(err => console.error('Initial ranking refresh failed:', err));
});
exports.default = app;
