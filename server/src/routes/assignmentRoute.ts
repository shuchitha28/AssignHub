import express from "express";
import { protect } from "../middleware/auth";
import { allowRoles } from "../middleware/role";
import {
  submitAssignment,
  getStudentSubmissions,
  deleteSubmission,
  reviewSubmission,
  updateSubmission,
  getTeacherSubmissions,
  getReportCardData,
} from "../controllers/submissionController";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentsBySubject,
  updateAssignment,
  getStudentAssignments,
  getTeacherAssignments,
} from "../controllers/assignmentController";

import Course from "../models/course";
import Subject from "../models/subject";
import Assignment from "../models/assignment";
import Submission from "../models/submission";

const router = express.Router();

/* ============================================================
   STUDENT SUBMISSION ROUTES (authenticated, role: student)
============================================================ */
// Save draft / Submit new
router.post(
  "/submit",
  protect,
  allowRoles("student"),
  submitAssignment
);

// Get all my submissions
router.get(
  "/my-submissions",
  protect,
  allowRoles("student"),
  getStudentSubmissions
);

// Update a submission (drafts / resubmission)
router.put(
  "/submissions/:id",
  protect,
  allowRoles("student"),
  updateSubmission
);
router.delete(
  "/submissions/:id",
  protect,
  allowRoles("student"),
  deleteSubmission
);

// Get all assignments for the student across all enrolled courses (for calendar)
router.get(
  "/student/upcoming",
  protect,
  allowRoles("student"),
  getStudentAssignments
);

/* ============================================================
   TEACHER / ADMIN ROUTES
============================================================ */
router.post("/", protect, allowRoles("teacher"), createAssignment);
router.get("/subject/:id", protect, allowRoles("teacher"), getAssignmentsBySubject);
router.put("/:id", protect, allowRoles("teacher"), updateAssignment);
router.delete("/:id", protect, allowRoles("teacher"), deleteAssignment);
router.get("/teacher/upcoming", protect, allowRoles("teacher"), getTeacherAssignments);

// Teacher reviews a submission
router.put(
  "/submissions/:id/review",
  protect,
  allowRoles("teacher"),
  reviewSubmission
);

// Get submissions for teacher review
router.get(
  "/submissions/teacher",
  protect,
  allowRoles("teacher"),
  getTeacherSubmissions
);

router.get(
  "/submissions/report-data",
  protect,
  allowRoles("teacher"),
  getReportCardData
);

/* ============================================================
   ADMIN ANALYTICS
============================================================ */
router.get("/analytics", protect, async (req, res) => {
  try {
    const courses = await Course.find();
    const result = [];

    for (const course of courses) {
      const subjects = await Subject.find({ course: course._id }).populate("teachers", "name email");
      const subjectData = [];

      for (const subject of subjects) {
        const assignments = await Assignment.find({ subject: subject._id });
        const assignmentData = [];

        for (const a of assignments) {
          const totalStudents = course.students.length;
          const submittedCount = await Submission.countDocuments({ assignment: a._id });

          assignmentData.push({
            _id: a._id,
            title: a.title,
            createdAt: a.createdAt,
            dueDate: a.deadline,
            totalMarks: a.totalMarks,
            submitted: submittedCount,
            notSubmitted: totalStudents - submittedCount,
            percentage:
              totalStudents > 0
                ? Math.round((submittedCount / totalStudents) * 100)
                : 0,
          });
        }

        subjectData.push({
          subjectName: subject.name,
          subjectCode: subject.code,
          teachers: (subject.teachers as any[]).map(t => ({
            name: t.name,
            email: t.email
          })),
          assignments: assignmentData,
        });
      }

      result.push({ 
        _id: course._id,
        courseName: course.name, 
        description: course.description,
        totalStudents: course.students.length,
        subjects: subjectData 
      });
    }

    res.json(result);
  } catch (err) {
    console.error("ASSIGNMENT ANALYTICS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;