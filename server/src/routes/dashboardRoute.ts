import express from "express";
import Course from "../models/course";
import Subject from "../models/subject";
import User from "../models/user";
import Assignment from "../models/assignment";
import Submission from "../models/submission";
import { protect } from "../middleware/auth";
import { getStudentDashboard, getTeacherDashboard } from "../controllers/dashboardController";
import { allowRoles } from "../middleware/role";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const students = await User.countDocuments({ role: "student" });
    const teachers = await User.countDocuments({ role: "teacher" });
    const courses = await Course.countDocuments();
    const subjects = await Subject.countDocuments();

    // REAL Trend Data: Monthly student registrations for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const studentTrends = await User.aggregate([
      {
        $match: {
          role: "student",
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trends = studentTrends.map(t => ({
      month: months[t._id.month - 1],
      students: t.count
    }));

    // Ensure we have 6 months even if some have 0 registrations
    const fullTrends = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const mName = months[d.getMonth()];
      const existing = trends.find(t => t.month === mName);
      fullTrends.push({
        month: mName,
        students: existing ? existing.students : 0
      });
    }

    // Recent Activity (Last 5 users/courses)
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(3);
    const recentCourses = await Course.find().sort({ createdAt: -1 }).limit(2);
    
    const activity = [
      ...recentUsers.map(u => ({ type: 'user', text: `New ${u.role} joined: ${u.name}`, time: u.createdAt })),
      ...recentCourses.map(c => ({ type: 'course', text: `Course created: ${c.name}`, time: c.createdAt }))
    ].sort((a: any, b: any) => b.time - a.time);

    // =============================
// TEACHER PASTE ANALYTICS
// =============================

const pasteAnalytics = await Submission.aggregate([
  {
    $match: {
      pastedPercentage: { $gt: 30 },
      assignment: { $ne: null }
    }
  },
  {
    $lookup: {
      from: "assignments",
      localField: "assignment",
      foreignField: "_id",
      as: "assignment"
    }
  },
  { $unwind: "$assignment" },

  {
    $lookup: {
      from: "users",
      localField: "assignment.teacher",
      foreignField: "_id",
      as: "teacher"
    }
  },
  { $unwind: "$teacher" },

  {
    $group: {
      _id: "$teacher.name",
      count: { $sum: 1 }
    }
  },

  { $sort: { count: -1 } }
]);

// =============================
// ASSIGNMENTS CREATED PER TEACHER
// =============================

const assignmentPerTeacher = await Assignment.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "teacher",
      foreignField: "_id",
      as: "teacher"
    }
  },
  { $unwind: "$teacher" },

  {
    $group: {
      _id: "$teacher.name",
      assignments: { $sum: 1 }
    }
  },

  { $sort: { assignments: -1 } }
]);

// =============================
// USER ROLE DISTRIBUTION
// =============================

const userDistribution = await User.aggregate([
  {
    $group: {
      _id: "$role",
      value: { $sum: 1 }
    }
  }
]);

// =============================
// SUBMISSION STATUS DISTRIBUTION
// =============================

const submissionDistribution = await Submission.aggregate([
  {
    $group: {
      _id: "$status",
      value: { $sum: 1 }
    }
  }
]);

// =============================
// SUBJECT + COURSE SUBMISSION STATUS
// =============================

const submissionStatusBySubject = await Submission.aggregate([
  {
    $lookup: {
      from: "assignments",
      localField: "assignment",
      foreignField: "_id",
      as: "assignment"
    }
  },
  { $unwind: "$assignment" },

  {
    $lookup: {
      from: "subjects",
      localField: "assignment.subject",
      foreignField: "_id",
      as: "subject"
    }
  },
  { $unwind: "$subject" },

  {
    $lookup: {
      from: "courses",
      localField: "subject.course",
      foreignField: "_id",
      as: "course"
    }
  },
  { $unwind: "$course" },

  {
    $group: {
      _id: {
        subject: "$subject.name",
        course: "$course.name"
      },

      submitted: {
        $sum: {
          $cond: [{ $eq: ["$status", "submitted"] }, 1, 0]
        }
      },

      reviewed: {
        $sum: {
          $cond: [{ $eq: ["$status", "reviewed"] }, 1, 0]
        }
      },

      draft: {
        $sum: {
          $cond: [{ $eq: ["$status", "draft"] }, 1, 0]
        }
      },

      revision_requested: {
        $sum: {
          $cond: [{ $eq: ["$status", "revision_requested"] }, 1, 0]
        }
      }
    }
  },

  {
    $project: {
      _id: 0,
      subject: "$_id.subject",
      course: "$_id.course",
      submitted: 1,
      reviewed: 1,
      draft: 1,
      revision_requested: 1
    }
  },

  {
    $sort: {
      course: 1,
      subject: 1
    }
  }
]);    
    
    res.json({
      students,
      teachers,
      courses,
      subjects,
      trends: fullTrends,
      activity,

  pasteAnalytics,
  assignmentPerTeacher,
  userDistribution,
  submissionDistribution,
  submissionStatusBySubject
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});





router.get(
  "/student",
  protect,
  allowRoles("student"),
  getStudentDashboard
);

router.get(
  "/teacher",
  protect,
  allowRoles("teacher"),
  getTeacherDashboard
);

export default router;
