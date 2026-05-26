import { Request, Response } from "express";
import Assignment from "../models/assignment";
import Course from "../models/course";
import Subject from "../models/subject";
import Submission from "../models/submission";
import User from "../models/User";

export const getStudentDashboard = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    // 1. Get courses student is enrolled in
    const courses = await Course.find({ students: userId });
    const courseIds = courses.map(c => c._id);

    // 2. Get subjects for those courses
    const subjects = await Subject.find({ course: { $in: courseIds } });
    const subjectIds = subjects.map(s => s._id);

    // 3. Get published assignments for those subjects
    const assignments = await Assignment.find({ 
      subject: { $in: subjectIds },
      publish: true 
    }).populate({
      path: "subject",
      select: "name course",
      populate: { path: "course", select: "name" }
    });

    const assignmentIds = assignments.map(a => a._id);

    // 4. Get student's completed submissions
    const submissions = await Submission.find({
      student: userId,
      assignment: { $in: assignmentIds },
      status: { $in: ["submitted", "reviewed"] }
    });

    const completedAssignmentIds = submissions.map(s => s.assignment?.toString());

    // 5. Calculate stats
    const total = assignments.length;
    const completed = submissions.length;
    const pending = total - completed;

    // 6. Get upcoming assignments (not completed, future deadline)
    const now = new Date();
    const upcomingAssignments = assignments
      .filter(a => a.deadline && !completedAssignmentIds.includes(a._id.toString()) && new Date(a.deadline) > now)
      .sort((a, b) => {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 3);

    // Map to expected format
    const upcoming = upcomingAssignments.map(a => ({
      _id: a._id,
      title: a.title,
      subject: a.subject, // populated object
      dueDate: a.deadline
    }));

    res.json({
      total,
      completed,
      pending,
      upcoming,
    });

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
};

export const getTeacherDashboard = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    // 1. Get subjects taught by the teacher
    const subjects = await Subject.find({ teachers: userId });
    const subjectIds = subjects.map(s => s._id);
    const courseIds = [...new Set(subjects.map(s => s.course.toString()))];

    // 2. Get assignments for the subjects taught by the teacher
    const assignments = await Assignment.find({ subject: { $in: subjectIds } });
    const assignmentIds = assignments.map(a => a._id);

    // 3. Get courses to count total students
    const courses = await Course.find({ _id: { $in: courseIds } });
    const studentIds = new Set();
    courses.forEach(c => {
      c.students.forEach(sId => studentIds.add(sId.toString()));
    });

    // 4. Get submissions for teacher's assignments
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      status: "submitted"
    }).populate("student", "name email profilePicture")
      .populate("assignment", "title")
      .sort({ submittedAt: -1 });

    const totalSubmissions = await Submission.countDocuments({
      assignment: { $in: assignmentIds },
      status: { $in: ["submitted", "reviewed"] }
    });

    const pendingReviews = submissions.length;

    // 5. Recent submissions (last 5)
    const recentSubmissions = submissions.slice(0, 5).map(s => ({
      _id: s._id,
      studentName: (s.student as any)?.name || "Unknown Student",
      studentPicture: (s.student as any)?.profilePicture,
      assignmentTitle: (s.assignment as any)?.title || "Unknown Assignment",
      submittedAt: s.submittedAt,
      status: s.status
    }));

    // 6. Submission trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const submissionTrends = await Submission.aggregate([
      {
        $match: {
          assignment: { $in: assignmentIds },
          submittedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in gaps for trends
    const trends = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const existing = submissionTrends.find(t => t._id === dateStr);
      trends.push({
        date: dateStr,
        count: existing ? existing.count : 0
      });
    }

    // 7. Upcoming deadlines (next 14 days)
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    const upcomingAssignments = await Assignment.find({
      subject: { $in: subjectIds }, // Fixed: query by subject IDs instead of direct teacher to support multi-teacher
      deadline: { $gte: new Date(), $lte: fourteenDaysFromNow }
    }).populate({
      path: "subject",
      select: "name course",
      populate: { path: "course", select: "name" }
    })
      .sort({ deadline: 1 })
      .limit(4);

    res.json({
      stats: {
        totalSubjects: subjects.length,
        totalAssignments: assignments.length,
        totalStudents: studentIds.size,
        pendingReviews,
        totalSubmissions
      },
      recentSubmissions,
      trends,
      upcomingAssignments: upcomingAssignments.map(a => ({
        _id: a._id,
        title: a.title,
        subjectName: (a.subject as any)?.name || "N/A",
        courseName: (a.subject as any)?.course?.name || "",
        deadline: a.deadline
      }))
    });

  } catch (err) {
    console.error("TEACHER DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Teacher dashboard error" });
  }
};

export const getDashboard = async (req: any, res: any) => {
  try {
    /* BASIC COUNTS */
    const students = await User.countDocuments({ role: "student" });
    const teachers = await User.countDocuments({ role: "teacher" });
    const courses = await Course.countDocuments();
    const subjects = await Subject.countDocuments();
    const assignments = await Assignment.countDocuments();

    /* USER DISTRIBUTION */
    const userDistribution = [
      {
        name: "Students",
        value: students,
      },
      {
        name: "Teachers",
        value: teachers,
      },
    ];

    /* SUBJECT WISE ASSIGNMENTS */
    const subjectAssignments = await Assignment.aggregate([
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      {
        $group: {
          _id: "$subject.name",
          assignments: { $sum: 1 },
        },
      },
      {
        $project: {
          subject: "$_id",
          assignments: 1,
          _id: 0,
        },
      },
    ]);

    /* SUBMISSION STATUS */
    const submittedCount = await Submission.countDocuments({
      status: "submitted",
    });

    const reviewedCount = await Submission.countDocuments({
      status: "reviewed",
    });

    const draftCount = await Submission.countDocuments({
      status: "draft",
    });

    const revisionCount = await Submission.countDocuments({
      status: "revision_requested",
    });

    const submissionStats = [
      { name: "Submitted", value: submittedCount },
      { name: "Reviewed", value: reviewedCount },
      { name: "Draft", value: draftCount },
      { name: "Revision", value: revisionCount },
    ];

    const totalStudents = await User.countDocuments({
      role: "student",
    });
    
    const submittedStudents = await Submission.distinct("student");
    
    const submissionOverview = [
      {
        name: "Submitted",
        value: submittedStudents.length,
      },
      {
        name: "Not Submitted",
        value: totalStudents - submittedStudents.length,
      },
    ];

    /* TEACHER PASTE ANALYTICS */
    const teacherPasteUsage = await Submission.aggregate([
      {
        $lookup: {
          from: "assignments",
          localField: "assignment",
          foreignField: "_id",
          as: "assignment",
        },
      },
      { $unwind: "$assignment" },

      {
        $lookup: {
          from: "users",
          localField: "assignment.teacher",
          foreignField: "_id",
          as: "teacher",
        },
      },
      { $unwind: "$teacher" },

      {
        $group: {
          _id: "$teacher.name",
          avgPaste: { $avg: "$pastedPercentage" },
          avgTyped: { $avg: "$typedPercentage" },
          students: { $sum: 1 },
        },
      },

      {
        $project: {
          teacher: "$_id",
          avgPaste: { $round: ["$avgPaste", 2] },
          avgTyped: { $round: ["$avgTyped", 2] },
          students: 1,
          _id: 0,
        },
      },
    ]);

    /* MONTHLY REGISTRATION TREND */
    const trends = await User.aggregate([
      {
        $match: {
          role: "student",
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
          },
          students: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id.month",
          students: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    /* RECENT ACTIVITY */
    const recentAssignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("teacher", "name");

    const activity = recentAssignments.map((a: any) => ({
      type: "assignment",
      text: `${a.teacher?.name} added assignment "${a.title}"`,
      time: a.createdAt,
    }));

    res.json({
      students,
      teachers,
      courses,
      subjects,
      assignments,

      userDistribution,
      subjectAssignments,
      submissionStats,
      submissionOverview,
      teacherPasteUsage,
      trends,
      activity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Dashboard fetch failed",
    });
  }
};
