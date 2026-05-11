import Assignment from "../models/assignment";
import Subject from "../models/subject";
import Course from "../models/course";
import { saveBase64File, deleteFile } from "../utils/fileUpload";


export const getStudentAssignments = async (req: any, res: any) => {
  try {
    // 1. Find all courses the student is enrolled in
    const enrolledCourses = await Course.find({ students: req.user._id });
    const courseIds = enrolledCourses.map(c => c._id);

    // 2. Find all published assignments for those courses
    const assignments = await Assignment.find({
      course: { $in: courseIds },
      publish: true
    }).populate({
      path: "subject",
      select: "name code course",
      populate: { path: "course", select: "name" }
    });

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createAssignment = async (req:any, res: any) => {
  try {
    const { title, description, deadline, totalMarks, subjectId, publish, pdfUrl } = req.body;

    // get subject
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // 2. Check if an assignment already exists for this subject this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    // Setting Sunday as the start of the week
    startOfWeek.setDate(now.getDate() - now.getDay());

    const existingAssignment = await Assignment.findOne({
      subject: subjectId,
      createdAt: { $gte: startOfWeek }
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        message: "Only one assignment per week is allowed for this subject." 
      });
    }
    
    // Save PDF if exists
    const finalPdfUrl = await saveBase64File(pdfUrl);


    const assignment = await Assignment.create({
      title,
      description,
      deadline,
      totalMarks,
      subject: subjectId,
      course: subject.course,
      teacher: req.user._id,
      publish,
      pdfUrl: finalPdfUrl,
    });


    res.status(201).json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAssignments = async (req: any, res: any) => {
  const assignments = await Assignment.find().populate("subject");
  res.json(assignments);
};

export const getAssignmentsBySubject = async (req: any, res: any) => {
  const assignments = await Assignment.find({
    subject: req.params.id,
  }).sort({ createdAt: -1 });

  res.json(assignments);
};

export const updateAssignment = async (req: any, res: any) => {
  if (req.body.pdfUrl) {
    req.body.pdfUrl = await saveBase64File(req.body.pdfUrl);
  }

  
  const updated = await Assignment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { returnDocument: 'after' }
  );


  res.json(updated);
};


export const deleteAssignment = async (req: any, res: any) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    // Clean up PDF file
    if (assignment.pdfUrl) {
      await deleteFile(assignment.pdfUrl);
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: "Assignment and related PDF deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Deletion failed" });
  }
};

export const getTeacherAssignments = async (req: any, res: any) => {
  try {
    const subjects = await Subject.find({ teachers: req.user._id });
    const subjectIds = subjects.map(s => s._id);

    const assignments = await Assignment.find({ subject: { $in: subjectIds } })
      .populate("subject", "name code");
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};