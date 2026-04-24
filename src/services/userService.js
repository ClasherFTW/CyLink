const Answer = require("../models/Answer");
const Question = require("../models/Question");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const pickPublicProfile = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  reputation: user.reputation,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getProfileStats = async (userId) => {
  const [questionCount, answerCount, topTags] = await Promise.all([
    Question.countDocuments({ userId }),
    Answer.countDocuments({ userId }),
    Question.aggregate([
      { $match: { userId } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]),
  ]);

  return {
    questionCount,
    answerCount,
    topTags,
  };
};

const getProfileById = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const stats = await getProfileStats(user._id);

  return {
    ...pickPublicProfile(user),
    stats,
  };
};

module.exports = {
  getProfileById,
};
