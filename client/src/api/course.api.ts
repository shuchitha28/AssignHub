// api/course.api.ts

import API from "./axios";

/* =========================
   COURSES
========================= */

export const getCourses = () => API.get("/courses");

export const createCourse = (data: {
  name: string;
  description: string;
}) => API.post("/courses", data);

export const getCourseDetails = (id: string) =>
  API.get(`/courses/${id}`);

export const updateCourse = (data: {
  id: string;
  name: string;
  description: string;
}) =>
  API.patch(`/courses/${data.id}`, {
    name: data.name,
    description: data.description,
  });

export const deleteCourse = (id: string) => API.delete(`/courses/${id}`);

/* =========================
   SUBJECTS
========================= */

export const createSubject = (data: {
  courseId: string;
  name: string;
}) =>
  API.post(`/courses/${data.courseId}/subjects`, {
    name: data.name,
  });

export const updateSubject = (data: {
  id: string;
  name: string;
}) =>
  API.patch(`/courses/subjects/${data.id}`, {
    name: data.name,
  });

export const assignTeacher = (data: {
  subjectId: string;
  teacherIds: string[];
}) =>
  API.patch(`/courses/subjects/${data.subjectId}/assign`, {
    teacherIds: data.teacherIds,
  });

/* =========================
   STUDENTS
========================= */

export const enrollStudent = (courseId: string) =>
  API.patch(`/courses/${courseId}/enroll`);

export const adminEnrollStudent = (data: { courseId: string; studentId: string }) =>
  API.patch(`/courses/${data.courseId}/enrollment/${data.studentId}`, { action: "approve" });

export const unenrollStudent = (data: { courseId: string; studentId: string }) =>
  API.delete(`/courses/${data.courseId}/students/${data.studentId}`);

/* =========================
   ANALYTICS
========================= */

export const getCourseAnalytics = (id: string) =>
  API.get(`/courses/${id}/analytics`);