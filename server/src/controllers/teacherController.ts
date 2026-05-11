import Course from "../models/course";
import Subject from "../models/subject";
import Assignment from "../models/assignment";

export const getTeacherCourses = async (req: any, res: any) => {
  try {
    // 1️⃣ Get subjects assigned to this teacher
    const subjects = await Subject.find({
      teachers: req.user._id,
    }).lean();

    // 2️⃣ Get unique course IDs
    const courseIds = [
      ...new Set(subjects.map((s) => s.course.toString())),
    ];

    // 3️⃣ Get courses
    const courses = await Course.find({
      _id: { $in: courseIds },
    }).lean();

    // 4️⃣ Attach subjects + assignments
    const result = await Promise.all(
      courses.map(async (course) => {
        const courseSubjects = subjects.filter(
          (s) => s.course.toString() === course._id.toString()
        );

        // attach assignments inside each subject
        const subjectsWithAssignments = await Promise.all(
          courseSubjects.map(async (s) => {
            const assignments = await Assignment.find({
              subject: s._id,
            }).sort({ createdAt: -1 });

            return {
              ...s,
              assignments,
            };
          })
        );

        return {
          ...course,
          subjects: subjectsWithAssignments,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTeacherSubjects = async (req: any, res: any) => {
  try {
    const subjects = await Subject.find({
      teachers: req.user._id,
    })
      .populate("course")
      .lean();

    // attach assignments
    const result = await Promise.all(
      subjects.map(async (s) => {
        const assignments = await Assignment.find({
          subject: s._id,
        }).sort({ createdAt: -1 });

        return {
          ...s,
          assignments,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};