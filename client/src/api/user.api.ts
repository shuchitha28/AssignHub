import API from "./axios";

export const getUsers = () => API.get("/users");

export const createUser = (data: any) =>
  API.post("/users", data);

export const updateUser = (id: string, data: any) =>
  API.put(`/users/${id}`, data);

export const deleteUser = (id: string) =>
  API.delete(`/users/${id}`);

export const toggleUserStatus = (id: string) =>
  API.patch(`/users/${id}/status`);