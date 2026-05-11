import API from "./axios";

export const getMyProfile = () => API.get("/profile/me");

export const updateMyProfile = (data: any) => API.put("/profile/update", data);

export const changeMyPassword = (data: any) => API.put("/profile/change-password", data);

export const sendSupportRequest = (data: any) => API.post("/profile/support-request", data);
