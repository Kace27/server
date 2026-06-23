"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playerController_1 = require("../controllers/playerController");
const router = (0, express_1.Router)();
// Public routes
router.get('/:username', playerController_1.getPlayerProfile);
router.get('/:username/history', playerController_1.getPlayerMatchHistory);
exports.default = router;
