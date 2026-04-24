const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateMiddleware");
const { authValidators } = require("../utils/validators");

const router = express.Router();

router.post("/register", authValidators.register, validateRequest, authController.register);
router.post("/login", authValidators.login, validateRequest, authController.login);
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

module.exports = router;
