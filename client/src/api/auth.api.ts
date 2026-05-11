import API from "./axios";

export const loginUser = (data: {
  email: string;
  password: string;
}) => API.post("/auth/login", data);

export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => API.post("/auth/register", data);

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAdmin = () => getUser()?.role === "admin";

export const forgotPassword = (data: { email: string }) => API.post("/auth/forgot-password", data);
export const resetPassword = (token: string, data: { password: string }) => API.post(`/auth/reset-password/${token}`, data);
export const googleLogin = (tokenId: string) => API.post("/auth/google-login", { tokenId });