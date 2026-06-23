"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rankingController_1 = require("../controllers/rankingController");
const router = (0, express_1.Router)();
// Public routes
router.get('/', rankingController_1.getRanking);
exports.default = router;
