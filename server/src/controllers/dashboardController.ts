import { Request, Response } from "express";
import Assignment from "../models/assignment";
import Course from "../models/course";
import Subject from "../models/subject";
import Submission from "../models/submission";
import User from "../models/user";

/* =========================================================
   STUDENT DASHBOARD
========================================================= */

export const getStudentDashboard = async (
  req: any,
  res: Response
) => {
  try {
    const userId = req.user._id;

    /* 1. COURSES */
    const courses = await Course.find({
      students: userId,
    });

    const courseIds = courses.map((c) => c._id);

    /* 2. SUBJECTS */
    const subjects = await Subject.find({
      course: { $in: courseIds },
    });

    const subjectIds = subjects.map((s) => s._id);

    /* 3. ASSIGNMENTS */
    const assignments = await Assignment.find({
      subject: { $in: subjectIds },
      publish: true,
    }).populate({
      path: "subject",
      select: "name course",
      populate: {
        path: "course",
        select: "name",
      },
    });

    const assignmentIds = assignments.map((a) => a._id);

    /* 4. SUBMISSIONS */
    const submissions = await Submission.find({
      student: userId,
      assignment: { $in: assignmentIds },
      status: {
        $in: ["submitted", "reviewed"],
      },
    });

    const completedAssignmentIds = submissions.map((s) =>
      s.assignment?.toString()
    );

    /* 5. STATS */
    const total = assignments.length;
    const completed = submissions.length;
    const pending = total - completed;

    /* 6. UPCOMING ASSIGNMENTS */
    const now = new Date();

    const upcomingAssignments = assignments
      .filter(
        (a: any) =>
          a.deadline &&
          !completedAssignmentIds.includes(a._id.toString()) &&
          new Date(a.deadline) > now
      )
      .sort((a: any, b: any) => {
        const dateA = a.deadline
          ? new Date(a.deadline).getTime()
          : 0;

        const dateB = b.deadline
          ? new Date(b.deadline).getTime()
          : 0;

        return dateA - dateB;
      })
      .slice(0, 5);

    const upcoming = upcomingAssignments.map((a: any) => ({
      _id: a._id,
      title: a.title,
      subject: a.subject,
      dueDate: a.deadline,
    }));

    /* 7. RECENT SUBMISSIONS */
    const recentSubmissions = await Submission.find({
      student: userId,
    })
      .populate("assignment", "title")
      .sort({ submittedAt: -1 })
      .limit(5);

    const recentActivity = recentSubmissions.map((s: any) => ({
      _id: s._id,
      assignmentTitle:
        s.assignment?.title || "Unknown Assignment",
      submittedAt: s.submittedAt,
      status: s.status,
    }));

    /* 8. WEEKLY SUBMISSION TREND */
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyTrend = await Submission.aggregate([
      {
        $match: {
          student: userId,
          submittedAt: {
            $gte: sevenDaysAgo,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$submittedAt",
            },
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const trends = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();

      d.setDate(d.getDate() - (6 - i));

      const dateStr = d.toISOString().split("T")[0];

      const existing = weeklyTrend.find(
        (t) => t._id === dateStr
      );

      trends.push({
        date: dateStr,
        count: existing ? existing.count : 0,
      });
    }

    res.json({
      stats: {
        total,
        completed,
        pending,
      },
      upcoming,
      recentActivity,
      trends,
    });
  } catch (err) {
    console.error("STUDENT DASHBOARD ERROR:", err);

    res.status(500).json({
      message: "Dashboard error",
    });
  }
};

/* =========================================================
   TEACHER DASHBOARD
========================================================= */

export const getTeacherDashboard = async (
  req: any,
  res: Response
) => {
  try {
    const userId = req.user._id;

    /* 1. SUBJECTS */
    const subjects = await Subject.find({
      teachers: userId,
    });

    const subjectIds = subjects.map((s) => s._id);

    const courseIds = [
      ...new Set(
        subjects.map((s: any) => s.course.toString())
      ),
    ];

    /* 2. ASSIGNMENTS */
    const assignments = await Assignment.find({
      subject: {
        $in: subjectIds,
      },
    });

    const assignmentIds = assignments.map((a) => a._id);

    /* 3. COURSES + STUDENTS */
    const courses = await Course.find({
      _id: {
        $in: courseIds,
      },
    });

    const studentIds = new Set<string>();

    courses.forEach((c: any) => {
      c.students.forEach((sId: any) => {
        studentIds.add(sId.toString());
      });
    });

    /* 4. SUBMISSIONS */
    const submissions = await Submission.find({
      assignment: {
        $in: assignmentIds,
      },
      status: "submitted",
    })
      .populate(
        "student",
        "name email profilePicture"
      )
      .populate("assignment", "title")
      .sort({
        submittedAt: -1,
      });

    const totalSubmissions =
      await Submission.countDocuments({
        assignment: {
          $in: assignmentIds,
        },
        status: {
          $in: ["submitted", "reviewed"],
        },
      });

    const pendingReviews = submissions.length;

    /* 5. RECENT SUBMISSIONS */
    const recentSubmissions = submissions
      .slice(0, 5)
      .map((s: any) => ({
        _id: s._id,
        studentName:
          s.student?.name || "Unknown Student",
        studentPicture:
          s.student?.profilePicture || "",
        assignmentTitle:
          s.assignment?.title ||
          "Unknown Assignment",
        submittedAt: s.submittedAt,
        status: s.status,
      }));

    /* 6. TRENDS */
    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 6
    );

    sevenDaysAgo.setHours(0, 0, 0, 0);

    const submissionTrends =
      await Submission.aggregate([
        {
          $match: {
            assignment: {
              $in: assignmentIds,
            },
            submittedAt: {
              $gte: sevenDaysAgo,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$submittedAt",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    const trends = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();

      d.setDate(d.getDate() - (6 - i));

      const dateStr = d
        .toISOString()
        .split("T")[0];

      const existing = submissionTrends.find(
        (t) => t._id === dateStr
      );

      trends.push({
        date: dateStr,
        count: existing ? existing.count : 0,
      });
    }

    /* 7. UPCOMING DEADLINES */
    const fourteenDaysFromNow = new Date();

    fourteenDaysFromNow.setDate(
      fourteenDaysFromNow.getDate() + 14
    );

    const upcomingAssignments =
      await Assignment.find({
        subject: {
          $in: subjectIds,
        },
        deadline: {
          $gte: new Date(),
          $lte: fourteenDaysFromNow,
        },
      })
        .populate({
          path: "subject",
          select: "name course",
          populate: {
            path: "course",
            select: "name",
          },
        })
        .sort({
          deadline: 1,
        })
        .limit(5);

    res.json({
      stats: {
        totalSubjects: subjects.length,
        totalAssignments:
          assignments.length,
        totalStudents:
          studentIds.size,
        pendingReviews,
        totalSubmissions,
      },

      recentSubmissions,

      trends,

      upcomingAssignments:
        upcomingAssignments.map(
          (a: any) => ({
            _id: a._id,
            title: a.title,
            subjectName:
              a.subject?.name || "N/A",
            courseName:
              a.subject?.course?.name ||
              "",
            deadline: a.deadline,
          })
        ),
    });
  } catch (err) {
    console.error(
      "TEACHER DASHBOARD ERROR:",
      err
    );

    res.status(500).json({
      message: "Teacher dashboard error",
    });
  }
};

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export const getDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    /* BASIC COUNTS */
    const students =
      await User.countDocuments({
        role: "student",
      });

    const teachers =
      await User.countDocuments({
        role: "teacher",
      });

    const courses =
      await Course.countDocuments();

    const subjects =
      await Subject.countDocuments();

    const assignments =
      await Assignment.countDocuments();

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

    /* SUBJECT ASSIGNMENTS */
    const subjectAssignments =
      await Assignment.aggregate([
        {
          $lookup: {
            from: "subjects",
            localField: "subject",
            foreignField: "_id",
            as: "subject",
          },
        },

        {
          $unwind: "$subject",
        },

        {
          $group: {
            _id: "$subject.name",
            assignments: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,
            subject: "$_id",
            assignments: 1,
          },
        },

        {
          $sort: {
            assignments: -1,
          },
        },
      ]);

    /* SUBMISSION STATUS */
    const submittedCount =
      await Submission.countDocuments({
        status: "submitted",
      });

    const reviewedCount =
      await Submission.countDocuments({
        status: "reviewed",
      });

    const draftCount =
      await Submission.countDocuments({
        status: "draft",
      });

    const revisionCount =
      await Submission.countDocuments({
        status: "revision_requested",
      });

    const submissionStats = [
      {
        name: "Submitted",
        value: submittedCount,
      },
      {
        name: "Reviewed",
        value: reviewedCount,
      },
      {
        name: "Draft",
        value: draftCount,
      },
      {
        name: "Revision",
        value: revisionCount,
      },
    ];

    /* SUBMISSION OVERVIEW */
    const submittedStudents =
      await Submission.distinct("student");

    const submissionOverview = [
      {
        name: "Submitted",
        value: submittedStudents.length,
      },
      {
        name: "Not Submitted",
        value:
          students -
          submittedStudents.length,
      },
    ];

    /* TEACHER PASTE ANALYTICS */
    const teacherPasteUsage =
      await Submission.aggregate([
        {
          $lookup: {
            from: "assignments",
            localField: "assignment",
            foreignField: "_id",
            as: "assignment",
          },
        },

        {
          $unwind: "$assignment",
        },

        {
          $lookup: {
            from: "users",
            localField:
              "assignment.teacher",
            foreignField: "_id",
            as: "teacher",
          },
        },

        {
          $unwind: "$teacher",
        },

        {
          $group: {
            _id: "$teacher.name",

            avgPaste: {
              $avg: "$pastedPercentage",
            },

            avgTyped: {
              $avg: "$typedPercentage",
            },

            students: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,

            teacher: "$_id",

            avgPaste: {
              $round: [
                "$avgPaste",
                2,
              ],
            },

            avgTyped: {
              $round: [
                "$avgTyped",
                2,
              ],
            },

            students: 1,
          },
        },
      ]);

    /* MONTHLY REGISTRATION TRENDS */
    const monthlyData =
      await User.aggregate([
        {
          $match: {
            role: "student",
          },
        },

        {
          $group: {
            _id: {
              month: {
                $month: "$createdAt",
              },
            },

            students: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,
            month: "$_id.month",
            students: 1,
          },
        },

        {
          $sort: {
            month: 1,
          },
        },
      ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const trends = monthNames.map(
      (month, index) => {
        const existing = monthlyData.find(
          (m) => m.month === index + 1
        );

        return {
          month,
          students: existing
            ? existing.students
            : 0,
        };
      }
    );

    /* RECENT ACTIVITY */
    const recentAssignments =
      await Assignment.find()
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .populate("teacher", "name");

    const activity =
      recentAssignments.map((a: any) => ({
        type: "assignment",
        text: `${
          a.teacher?.name || "Teacher"
        } added assignment "${
          a.title
        }"`,
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
    console.error(
      "ADMIN DASHBOARD ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Dashboard fetch failed",
    });
  }
};
