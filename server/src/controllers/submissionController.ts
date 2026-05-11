import Submission from "../models/submission";
import Subject from "../models/subject";
import Assignment from "../models/assignment";

export const submitAssignment = async (req: any, res: any) => {
  try {
    const { id } = req.body; // If ID exists, it's an update
    const student = req.user._id;

    if (id) {
      const updated = await Submission.findOneAndUpdate(
        { _id: id, student },
        { ...req.body, student },
        { returnDocument: 'after' }

      );
      return res.json(updated);
    }

    const submission = await Submission.create({
      ...req.body,
      student
    });
    res.status(201).json(submission);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentSubmissions = async (req: any, res: any) => {
  try {
    const student = req.user._id;
    
    // 1. Get courses student is currently enrolled in
    const Course = (await import("../models/course")).default;
    const Subject = (await import("../models/subject")).default;
    const Assignment = (await import("../models/assignment")).default;

    const enrolledCourses = await Course.find({ students: student });
    const courseIds = enrolledCourses.map(c => c._id);

    // 2. Get subjects for those courses
    const subjects = await Subject.find({ course: { $in: courseIds } });
    const subjectIds = subjects.map(s => s._id);

    // 3. Get assignments for those subjects
    const assignments = await Assignment.find({ subject: { $in: subjectIds } });
    const assignmentIds = assignments.map(a => a._id);

    // 4. Fetch submissions only for those assignments OR independent drafts (no assignment)
    const submissions = await Submission.find({ 
      student,
      $or: [
        { assignment: { $in: assignmentIds } },
        { assignment: { $exists: false } },
        { assignment: null }
      ]
    })
      .populate({
        path: "assignment",
        select: "title description totalMarks pdfUrl subject course teacher deadline publish",
        populate: [
          { path: "subject", select: "name" },
          { path: "course", select: "name" },
          { path: "teacher", select: "name" }
        ]
      })
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error: any) {
    console.error("GET STUDENT SUBMISSIONS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

import { deleteFile } from "../utils/fileUpload";

export const deleteSubmission = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const student = req.user._id;
    
    const submission = await Submission.findOne({ _id: id, student });
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // Clean up file if exists
    if (submission.fileUrl) {
      await deleteFile(submission.fileUrl);
    }

    await Submission.findOneAndDelete({ _id: id, student });
    res.json({ message: "Deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const reviewSubmission = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const updated = await Submission.findByIdAndUpdate(
      id,
      { ...req.body, reviewedBy: req.user._id },
      { returnDocument: 'after' }

    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSubmission = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const student = req.user._id;
    const updated = await Submission.findOneAndUpdate(
      { _id: id, student },
      req.body,
      { returnDocument: 'after' }

    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeacherSubmissions = async (req: any, res: any) => {
  try {
    const teacherId = req.user._id;
    
    // 1. Get subjects taught by this teacher
    const subjects = await Subject.find({ teachers: teacherId });
    const subjectIds = subjects.map(s => s._id);
    
    // 2. Get assignments for those subjects
    const assignments = await Assignment.find({ subject: { $in: subjectIds } });
    const assignmentIds = assignments.map(a => a._id);
    
    // 3. Get all "submitted" and "reviewed" entries for these assignments
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      status: { $in: ["submitted", "reviewed", "revision_requested"] }
    })
    .populate("student", "name email")
    .populate("reviewedBy", "name")
    .populate({
      path: "assignment",
      select: "title description subject totalMarks pdfUrl course teacher",
      populate: [
        { 
          path: "subject", 
          select: "name teachers",
          populate: { path: "teachers", select: "name" }
        },
        { path: "course", select: "name" },
        { path: "teacher", select: "name" }
      ]
    })
    .populate("reviewedBy", "name")
    .sort({ updatedAt: -1 });

    res.json(submissions);
  } catch (error: any) {
    console.error("GET TEACHER SUBMISSIONS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getReportCardData = async (req: any, res: any) => {
  try {
    const teacherId = req.user._id;

    // 1. Get all assignments for subjects taught by this teacher
    const subjects = await Subject.find({ teachers: teacherId });
    const subjectIds = subjects.map(s => s._id);

    const assignments = await Assignment.find({ subject: { $in: subjectIds } })
      .populate({
        path: "subject",
        select: "name teachers",
        populate: { path: "teachers", select: "name" }
      })
      .populate({
        path: "course",
        select: "name students",
        populate: { path: "students", select: "name email" }
      });

    const assignmentIds = assignments.map(a => a._id);

    // 2. Get all submissions for these assignments
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds }
    }).populate("student", "name email");

    res.json({
      assignments,
      submissions
    });
  } catch (error: any) {
    console.error("GET REPORT CARD DATA ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};