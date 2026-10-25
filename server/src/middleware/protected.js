import jwt from "jsonwebtoken";
import User from "../models/User_Model.js";

// Middleware to protect MERN routes.
// Requires a valid access token (cookie or Bearer header) issued by /api/auth.
// No anonymous or shared fallback user: failed authentication returns 401.
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Ingest token from cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2. Ingest token from Authorization header fallback
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token provided." });
    }

    // 3. Verify against the same secret and payload shape used at login
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.user = await User.findById(decoded.userId);

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized, account not found." });
      }

      return next();
    } catch (tokenErr) {
      return res.status(401).json({ success: false, message: "Not authorized, token invalid or expired." });
    }
  } catch (error) {
    console.error("Auth protection middleware error:", error);
    return res.status(401).json({ success: false, message: "Not authorized." });
  }
};
