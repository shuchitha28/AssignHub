import Course from "../models/course";
import Subject from "../models/subject";
import Assignment from "../models/assignment";

export const createCourse = async (req: any, res: any) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const course = await Course.create({ name, description });

    res.status(201).json(course);
  } catch (err) {
    console.error("CREATE COURSE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCourses = async (req: any, res: any) => {
  try {
    const courses = await Course.find().populate("students pendingStudents");

    const subjects = await Subject.find().populate("teachers", "name email");

    const result = [];

    for (const course of courses) {
      const courseSubjects = subjects.filter(
        (s) => s.course.toString() === course._id.toString()
      );

      const subjectData = [];

      for (const subject of courseSubjects) {
        const assignments = await Assignment.find({
          subject: subject._id,
        }).sort({ createdAt: -1 });

        subjectData.push({
          ...subject.toObject(),
          assignments,
        });
      }

      result.push({
        ...course.toObject(),
        subjects: subjectData, // ✅ IMPORTANT
        subjectsCount: subjectData.length,
      });
    }

    res.json(result);

  } catch (err) {
    console.error("GET COURSES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const enrollStudent = async (req: any, res: any) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.students) {
      course.students = [];
    }

    const alreadyEnrolled = course.students.some(
      (id: any) => id.toString() === studentId.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: "Already enrolled" });
    }
    
    const alreadyPending = course.pendingStudents?.some(
      (id: any) => id.toString() === studentId.toString()
    );

    if (alreadyPending) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const Setting = require("../models/setting").default;
    const settings = await Setting.findOne();
    const isAutoAccept = settings?.data?.autoAcceptEnrollment || false;

    if (isAutoAccept) {
      course.students.push(studentId);
    } else {
      if (!course.pendingStudents) course.pendingStudents = [];
      course.pendingStudents.push(studentId);
    }

    await course.save();

    res.json({ message: isAutoAccept ? "Enrolled successfully" : "Request sent successfully" });

  } catch (err) {
    console.error("ENROLL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};