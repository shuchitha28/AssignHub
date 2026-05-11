import Subject from "../models/subject";

export const createSubject = async (req: any, res: any) => {
  const subject = await Subject.create(req.body);
  res.json(subject);
};

export const getSubjects = async (req: any, res: any) => {
  const subjects = await Subject.find().populate("teachers");
  res.json(subjects);
};