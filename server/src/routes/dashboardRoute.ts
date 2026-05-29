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

    const courseDistribution = await Course.aggregate([
  {
    $project: {
      name: 1,
      studentsCount: { $size: "$students" }
    }
  },
  {
    $sort: { studentsCount: -1 }
  }
]);

    const totalAssignments = await Assignment.countDocuments();

const reviewedSubmissions = await Submission.countDocuments({
  status: "reviewed"
});

const pendingSubmissions = await Submission.countDocuments({
  status: "submitted"
});

const draftSubmissions = await Submission.countDocuments({
  status: "draft"
});

const assignmentStatus = [
  {
    name: "Reviewed",
    value: reviewedSubmissions
  },
  {
    name: "Pending",
    value: pendingSubmissions
  },
  {
    name: "Draft",
    value: draftSubmissions
  }
];

    const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const assignmentTrend = await Assignment.aggregate([
  {
    $match: {
      createdAt: { $gte: thirtyDaysAgo }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt"
        }
      },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
]);

    const performanceAnalytics = await Submission.aggregate([
  {
    $match: {
      marks: { $exists: true }
    }
  },
  {
    $group: {
      _id: null,
      avgMarks: { $avg: "$marks" },
      avgWpm: { $avg: "$wpm" },
      avgTypedPercentage: { $avg: "$typedPercentage" }
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
        courseDistribution,
  assignmentStatus,
  assignmentTrend,
  performance: performanceAnalytics[0] || {
    avgMarks: 0,
    avgWpm: 0,
    avgTypedPercentage: 0
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
