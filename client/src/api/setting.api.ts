import API from "./axios";

export const getSettings = () => API.get("/settings");
export const updateSettings = (data: any) =>
  API.put("/settings", data);