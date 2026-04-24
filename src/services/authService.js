const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { hashPassword, comparePassword } = require("./auth/hash");
const { signAccessToken } = require("./auth/token");

const buildAuthPayload = (user) => {
  const safeUser = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    reputation: user.reputation,
    createdAt: user.createdAt,
  };

  const token = signAccessToken({
    id: user._id,
    role: user.role,
  });

  return {
    token,
    user: safeUser,
  };
};

const registerUser = async ({ username, email, password, role }) => {
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists.");
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || "user",
  });

  return buildAuthPayload(user);
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  return buildAuthPayload(user);
};

module.exports = {
  registerUser,
  loginUser,
};
