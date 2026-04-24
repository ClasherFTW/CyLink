const asyncHandler = require("../utils/asyncHandler");
const { registerUser, loginUser } = require("../services/authService");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000,
};

const register = asyncHandler(async (req, res) => {
  const payload = await registerUser(req.body);
  res.cookie("accessToken", payload.token, cookieOptions);

  res.status(201).json({
    success: true,
    message: "User registered successfully.",
    data: payload,
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = await loginUser(req.body);
  res.cookie("accessToken", payload.token, cookieOptions);

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: payload,
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("accessToken", cookieOptions);

  res.status(200).json({
    success: true,
    message: "Logout successful.",
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      reputation: req.user.reputation,
      bio: req.user.bio,
      avatarUrl: req.user.avatarUrl,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
};
