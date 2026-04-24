const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../services/auth/token");

const extractToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

const attachUserFromToken = async (req, required) => {
  const token = extractToken(req);

  if (!token) {
    if (required) {
      throw new ApiError(401, "Authentication required.");
    }
    return null;
  }

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new ApiError(401, "Invalid authentication token.");
  }

  req.user = user;
  return user;
};

const protect = async (req, _res, next) => {
  try {
    await attachUserFromToken(req, true);
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    await attachUserFromToken(req, false);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  optionalAuth,
};
