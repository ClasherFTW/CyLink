const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { verifyFirebaseIdToken } = require("../config/firebaseAdmin");

const extractToken = (req) => {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

const attachFirebaseAuth = async (req, required, checkRevoked = false) => {
  const token = extractToken(req);

  if (!token) {
    if (required) {
      throw new ApiError(401, "Authentication required.");
    }
    return null;
  }

  try {
    const decoded = await verifyFirebaseIdToken(token, checkRevoked);
    req.firebaseAuth = decoded;
    return decoded;
  } catch (error) {
    if (error?.code === "auth/id-token-expired") {
      throw new ApiError(401, "Firebase authentication token expired.");
    }
    if (error?.code === "auth/id-token-revoked") {
      throw new ApiError(401, "Session revoked. Please login again.");
    }
    throw new ApiError(401, "Invalid Firebase authentication token.");
  }
};

const attachAppUser = async (req, required) => {
  const firebaseAuth = req.firebaseAuth;
  if (!firebaseAuth?.uid) {
    if (required) {
      throw new ApiError(401, "Authentication required.");
    }
    return null;
  }

  const user = await User.findOne({ firebaseUid: firebaseAuth.uid });
  if (!user) {
    if (required) {
      throw new ApiError(
        401,
        "No CyLink profile found for this Firebase account. Call /auth/sync first."
      );
    }
    return null;
  }

  req.user = user;
  return user;
};

const protectFirebaseToken = async (req, _res, next) => {
  try {
    await attachFirebaseAuth(req, true, true);
    next();
  } catch (error) {
    next(error);
  }
};

const protect = async (req, _res, next) => {
  try {
    await attachFirebaseAuth(req, true, true);
    await attachAppUser(req, true);
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const firebaseAuth = await attachFirebaseAuth(req, false);
    if (!firebaseAuth) {
      return next();
    }

    await attachAppUser(req, false);
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  protect,
  optionalAuth,
  protectFirebaseToken,
};
