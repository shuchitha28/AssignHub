import express from "express";
import Course from "../models/course";
import Subject from "../models/subject";
import Assignment from "../models/assignment";
import Submission from "../models/submission";
import User from "../models/user";
import Setting from "../models/setting";

import { createCourse, getCourses } from "../controllers/courseController";
import { protect } from "../middleware/auth";
import { allowRoles } from "../middleware/role";
import mongoose from "mongoose";

const router = express.Router();

/* =============================
   COURSE CRUD
============================= */

// ✅ Create Course (Admin only)
router.post("/", protect, allowRoles("admin"), createCourse);

// ✅ Get All Courses
router.get("/", protect, getCourses);

/* =============================
   COURSE ANALYTICS (IMPORTANT: BEFORE /:id)
============================= */

router.get("/:id/analytics", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const studentsCount = course.students?.length || 0;

    const subjectsCount = await Subject.countDocuments({
      course: course._id,
    });

    // Dummy performance (replace later)
    const performance = Math.floor(Math.random() * 100);

    res.json({
      studentsCount,
      subjectsCount,
      performance,
    });
  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =============================
   COURSE DETAILS
============================= */

router.get("/:id", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("students");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const subjects = await Subject.find({ course: course._id })
      .populate("teachers", "name email");

    res.json({ course, subjects });
  } catch (err) {
    console.error("GET COURSE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { name, description } = req.body;

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { returnDocument: 'after' }

    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (err) {
    console.error("UPDATE COURSE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete Course & All Related Data (Admin only)
router.delete("/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const courseId = req.params.id;

    // 1. Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 2. Find all subjects in this course
    const subjects = await Subject.find({ course: courseId });
    const subjectIds = subjects.map(s => s._id);

    // 3. Find all assignments in these subjects
    const assignments = await Assignment.find({ subject: { $in: subjectIds } });
    const assignmentIds = assignments.map(a => a._id);

    // 4. Cascade Delete
    // Delete Submissions
    await Submission.deleteMany({ assignment: { $in: assignmentIds } });
    
    // Delete Assignments
    await Assignment.deleteMany({ subject: { $in: subjectIds } });

    // Delete Subjects
    await Subject.deleteMany({ course: courseId });

    // 5. Unset course for all users enrolled in this course
    await User.updateMany(
      { course: courseId },
      { $unset: { course: "" } }
    );

    // Finally, delete the Course
    await Course.findByIdAndDelete(courseId);

    res.json({ message: "Course and all related data deleted successfully" });

  } catch (err: any) {
    console.error("DELETE COURSE ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* =============================
   SUBJECTS
============================= */
router.post("/:courseId/subjects", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Subject name required" });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    /* 🔥 CODE GENERATION - unique within the course only */
    const prefix = name
      .substring(0, 4)
      .toUpperCase()
      .replace(/\s/g, "");

    const count = await Subject.countDocuments({
      course: course._id,
    });

    // Ensure the generated code doesn't collide within this course
    let code = `${prefix}-${count + 1}`;
    let codeExists = await Subject.findOne({ code, course: course._id });
    let suffix = count + 2;
    while (codeExists) {
      code = `${prefix}-${suffix}`;
      codeExists = await Subject.findOne({ code, course: course._id });
      suffix++;
    }

    const subject = await Subject.create({
      name,
      code,
      course: course._id,
    });

    res.status(201).json(subject);

  } catch (err: any) {
    console.error("❌ SUBJECT ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Assign Teacher (Admin only)
router.patch(
  "/subjects/:id/assign",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { teacherIds } = req.body;

      if (!teacherIds || !Array.isArray(teacherIds)) {
        return res.status(400).json({ message: "Teacher IDs array required" });
      }

      const subject = await Subject.findByIdAndUpdate(
        req.params.id,
        { teachers: teacherIds },
        { returnDocument: 'after' }

      ).populate("teachers", "name email");

      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }

      res.json(subject);
    } catch (err) {
      console.error("ASSIGN TEACHER ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PATCH /courses/:id/enroll

router.patch(
  "/:id/enroll",
  protect,
  allowRoles("student"),
  async (req: any, res: any) => {
    try {
      const studentId = req.user._id;

      // Check auto-accept setting
      const settings = await Setting.findOne();
      const isAutoAccept = settings?.data?.autoAcceptEnrollment ?? false;

      let update;
      let message;

      if (isAutoAccept) {
        update = { $addToSet: { students: studentId } };
        message = "Enrolled successfully!";
      } else {
        update = { $addToSet: { pendingStudents: studentId } };
        message = "Enrollment request sent. Awaiting admin approval.";
      }

      const course = await Course.findByIdAndUpdate(
        req.params.id,
        update,
        { returnDocument: 'after' }
      );

      res.json({ message, course });
    } catch (err) {

      console.error("❌ ENROLL ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.patch("/subjects/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { name } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name },
      { returnDocument: 'after' }

    );

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json(subject);

  } catch (err) {
    console.error("❌ UPDATE SUBJECT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/subjects/:id", protect, allowRoles("admin"), async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =============================
   ENROLLMENT REQUESTS (ADMIN)
============================= */

// Get all pending enrollment requests across all courses
router.get("/enrollment-requests/pending", protect, allowRoles("admin"), async (req, res) => {
  try {
    const courses = await Course.find({ 
      "pendingStudents.0": { $exists: true } 
    }).populate("pendingStudents", "name email");
    
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Approve/Reject request
router.patch("/:courseId/enrollment/:studentId", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const { courseId, studentId } = req.params;

    if (action === "approve") {
      await Course.findByIdAndUpdate(courseId, {
        $pull: { pendingStudents: studentId },
        $addToSet: { students: studentId }
      });
      res.json({ message: "Enrolled successfully" });
    } else {
      await Course.findByIdAndUpdate(courseId, {
        $pull: { pendingStudents: studentId }
      });
      res.json({ message: "Request rejected" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Remove Student (Admin only)
router.delete("/:courseId/students/:studentId", protect, allowRoles("admin"), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    await Course.findByIdAndUpdate(courseId, {
      $pull: { students: studentId }
    });

    res.json({ message: "Student removed from course" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;