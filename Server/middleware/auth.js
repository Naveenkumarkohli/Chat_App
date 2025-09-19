import User from "../models/user.js";
import jwt from "jsonwebtoken";

// middleware to protect route
export const protectRoute = async (req, res, next) => {
  try {
    // accept either custom token header or Authorization: Bearer <token>
    const bearer = req.headers.authorization;
    const headerToken = req.headers.token;
    const token = headerToken || (bearer && bearer.startsWith("Bearer ") ? bearer.split(" ")[1] : null);
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized: token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User Not Found" });
    req.user = user;
    next();
  } catch (error) {
    console.log(error.message);
    return res.status(401).json({ success: false, message: "Unauthorized: " + error.message });
  }
};

// controller to check if user is authenticated
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};
