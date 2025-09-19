import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Check authentication and connect socket
  const checkAuth = async () => {
    try {
      if (!token) return;

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      logout();
    }
  };

  // Login
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["Authorization"] = null;
    if (socket) socket.disconnect();
    toast.success("Logged out successfully");
  };

  // Update profile (add cache-busting and optimistic UI)
  const updateProfile = async (body) => {
    try {
      // Optimistic update for snappier UX
      if (body.fullName || body.bio || body.profilePic) {
        setAuthUser(prev => prev ? { ...prev, fullName: body.fullName ?? prev.fullName, bio: body.bio ?? prev.bio } : prev);
      }

      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        const ts = Date.now();
        const nextUser = {
          ...data.user,
          // cache-bust profilePic so browser/CDN fetches the fresh image immediately
          profilePic: data.user?.profilePic ? `${data.user.profilePic}?t=${ts}` : data.user?.profilePic,
        };
        setAuthUser(nextUser);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  // Connect Socket.IO with JWT auth
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      auth: { token: localStorage.getItem("token") }, // send JWT for socket
      query: { userId: userData._id },
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
