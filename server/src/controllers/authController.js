const asyncHandler = require("../utils/asyncHandler");
const { pickPublicUser, syncUserFromFirebase } = require("../services/authService");
const { revokeFirebaseUserSessions } = require("../config/firebaseAdmin");

const syncProfile = asyncHandler(async (req, res) => {
  const user = await syncUserFromFirebase({
    firebaseAuth: req.firebaseAuth,
    preferredUsername: req.body.username,
    avatarUrl: req.body.avatarUrl,
  });

  res.status(200).json({
    success: true,
    message: "Firebase profile synced.",
    data: user,
  });
});

const logout = asyncHandler(async (req, res) => {
  const firebaseUid = req.firebaseAuth?.uid;
  if (firebaseUid) {
    await revokeFirebaseUserSessions(firebaseUid);
  }

  res.status(200).json({
    success: true,
    message: "Logout successful. Session revoked.",
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: pickPublicUser(req.user),
  });
});

module.exports = {
  syncProfile,
  logout,
  getMe,
};
