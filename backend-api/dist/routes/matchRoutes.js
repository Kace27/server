"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matchController_1 = require("../controllers/matchController");
const router = (0, express_1.Router)();
// Public route to get matches list
router.get('/', matchController_1.getRecentMatches);
exports.default = router;
