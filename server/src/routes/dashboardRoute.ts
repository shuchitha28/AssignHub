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

// =============================
// REGISTRATION + PLATFORM TRENDS
// =============================

const daysBack = 30;

const startDate = new Date();
startDate.setDate(startDate.getDate() - daysBack);
startDate.setHours(0, 0, 0, 0);
    
const trends = [];

for (let i = 29; i >= 0; i--) {
  const current = new Date();

  current.setDate(current.getDate() - i);

  const start = new Date(current);
  start.setHours(0, 0, 0, 0);

  const end = new Date(current);
  end.setHours(23, 59, 59, 999);

  const [
    students,
    teachers,
    courses,
    subjects
  ] = await Promise.all([
    User.countDocuments({
      role: "student",
      createdAt: { $gte: start, $lt: end }
    }),

    User.countDocuments({
      role: "teacher",
      createdAt: { $gte: start, $lt: end }
    }),

    Course.countDocuments({
      createdAt: { $gte: start, $lt: end }
    }),

    Subject.countDocuments({
      createdAt: { $gte: start, $lt: end }
    })
  ]);

  trends.push({
    date: start.toISOString(),
    students,
    teachers,
    courses,
    subjects
  });
}

    // Recent Activity (Last 5 users/courses)
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(3);
    const recentCourses = await Course.find().sort({ createdAt: -1 }).limit(2);
    
    const activity = [
      ...recentUsers.map(u => ({ type: 'user', text: `New ${u.role} joined: ${u.name}`, time: u.createdAt })),
      ...recentCourses.map(c => ({ type: 'course', text: `Course created: ${c.name}`, time: c.createdAt }))
    ].sort(
  (a: any, b: any) =>
    new Date(b.time).getTime() - new Date(a.time).getTime()
);

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
  {
  $unwind: {
    path: "$assignment",
    preserveNullAndEmptyArrays: true
  }
},

  {
    $lookup: {
      from: "users",
      localField: "assignment.teacher",
      foreignField: "_id",
      as: "teacher"
    }
  },
  {
  $unwind: {
    path: "$teacher",
    preserveNullAndEmptyArrays: true
  }
},

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
  {
  $unwind: {
    path: "$teacher",
    preserveNullAndEmptyArrays: true
  }
},

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
// COURSE DISTRIBUTION
// =============================

const courseDistribution = await Subject.aggregate([
  {
    $lookup: {
      from: "courses",
      localField: "course",
      foreignField: "_id",
      as: "course"
    }
  },
  { $unwind: "$course" },

  {
    $group: {
      _id: "$course.name",
      value: { $sum: 1 }
    }
  },

  {
    $sort: { value: -1 }
  }
]);
// =============================
// SUBJECT DISTRIBUTION
// =============================

const subjectDistribution = await Assignment.aggregate([
  {
    $lookup: {
      from: "subjects",
      localField: "subject",
      foreignField: "_id",
      as: "subject"
    }
  },
  { $unwind: "$subject" },

  {
    $group: {
      _id: "$subject.name",
      value: { $sum: 1 }
    }
  },

  {
    $sort: { value: -1 }
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
  {
  $unwind: {
    path: "$assignment",
    preserveNullAndEmptyArrays: true
  }
},

  {
    $lookup: {
      from: "subjects",
      localField: "assignment.subject",
      foreignField: "_id",
      as: "subject"
    }
  },
  {
  $unwind: {
    path: "$subject",
    preserveNullAndEmptyArrays: true
  }
},

  {
    $lookup: {
      from: "courses",
      localField: "subject.course",
      foreignField: "_id",
      as: "course"
    }
  },
  {
  $unwind: {
    path: "$course",
    preserveNullAndEmptyArrays: true
  }
},

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
      trends,
      activity,

  pasteAnalytics,
  assignmentPerTeacher,
  userDistribution,
  courseDistribution,
subjectDistribution,
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
