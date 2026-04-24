const express = require("express");
const aiController = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateMiddleware");
const { aiValidators } = require("../utils/validators");

const router = express.Router();

// Router-level middleware for private AI endpoints.
router.use(protect);

router.post("/chat", aiValidators.chat, validateRequest, aiController.chatWithAI);

module.exports = router;
