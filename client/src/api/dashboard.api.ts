import API from "./axios";

export const getDashboard = () => API.get("/dashboard");
export const getStudentDashboard = () =>
  API.get("/dashboard/student");
export const getTeacherDashboard = () =>
  API.get("/dashboard/teacher");