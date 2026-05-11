import API from "./axios";

/* ─── Teacher ─── */
export const getAssignmentAnalytics = () =>
  API.get("/assignments/analytics");

export const createAssignment = (data: {
  title: string;
  description: string;
  deadline: string;
  totalMarks: number;
  subjectId: string;
  publish: boolean;
}) => API.post("/assignments", data);

/* ─── Student Submissions ─── */
export interface SubmissionPayload {
  title: string;
  content: string;
  wordCount: number;
  wpm: number;
  typedPercentage: number;
  pastedPercentage: number;
  typedChars?: number;
  pastedChars?: number;
  status: "draft" | "submitted";
  assignmentId?: string;
  submissionId?: string; // for updates
}

export const saveSubmission = (data: SubmissionPayload) =>
  API.post("/assignments/submit", data);

export const getMySubmissions = () =>
  API.get("/assignments/my-submissions");

export const deleteMySubmission = (id: string) =>
  API.delete(`/assignments/submissions/${id}`);

export const updateSubmission = (id: string, data: Partial<SubmissionPayload>) =>
  API.put(`/assignments/submissions/${id}`, data);

export const getUpcomingAssignments = () =>
  API.get("/assignments/student/upcoming");

export const getTeacherUpcomingAssignments = () =>
  API.get("/assignments/teacher/upcoming");

export const getTeacherSubmissions = () =>
  API.get("/assignments/submissions/teacher");

export const reviewSubmission = (id: string, data: { marks?: number; feedback?: string; status?: string }) =>
  API.put(`/assignments/submissions/${id}/review`, data);

export const getReportCardData = () =>
  API.get("/assignments/submissions/report-data");