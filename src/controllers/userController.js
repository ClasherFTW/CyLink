const asyncHandler = require("../utils/asyncHandler");
const { getProfileById } = require("../services/userService");

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getProfileById(req.user._id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const profile = await getProfileById(req.params.id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

module.exports = {
  getMyProfile,
  getUserProfile,
};
