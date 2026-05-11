// pages/admin/CourseDetails.tsx
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { getFileUrl } from "../../utils/file";

import { motion, AnimatePresence } from "framer-motion";

import {
  getCourseDetails,
  getCourseAnalytics,
  createSubject,
  assignTeacher,
  adminEnrollStudent,
  unenrollStudent,
  updateCourse,
  deleteCourse,
} from "../../api/course.api";
import { 
  Mail, 
  Shield, 
  UserMinus, 
  Plus, 
  Trash2, 
  Search, 
  GraduationCap, 
  CheckCircle2, 
  BookOpen, 
  ChevronLeft,
  Edit3,
  Users,
  Layers,
  TrendingUp,
  Settings,
  X
} from "lucide-react";

import { getUsers } from "../../api/user.api";
import { isAdmin } from "../../api/auth.api";
import { useTheme } from "../../hooks/useTheme";

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "subjects";
  const { colorTheme } = useTheme();

  const qc = useQueryClient();

  const [subjectName, setSubjectName] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const [showSubject, setShowSubject] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    description: "",
  });

  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [managingTeachersFor, setManagingTeachersFor] = useState<any>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [studentToUnenroll, setStudentToUnenroll] = useState<any>(null);
  const [showEndCourseModal, setShowEndCourseModal] = useState(false);

  /* ================= FETCH ================= */

  const { data, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => getCourseDetails(id!),
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics", id],
    queryFn: () => getCourseAnalytics(id!),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const teachers = users?.data?.filter((u: any) => u.role === "teacher") || [];

  const course = data?.data?.course;
  const subjects = data?.data?.subjects || [];
  const students = course?.students || [];

  /* ================= MUTATIONS ================= */

  const addSubject = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      toast.success("Subject added");
      qc.invalidateQueries({ queryKey: ["course", id] });
      setShowSubject(false);
      setSubjectName("");
    },
  });

  const assign = useMutation({
    mutationFn: assignTeacher,
    onSuccess: () => {
      toast.success("Teacher assigned");
      qc.invalidateQueries({ queryKey: ["course", id] });
    },
  });

  const enroll = useMutation({
    mutationFn: (sId: string) => adminEnrollStudent({ courseId: id!, studentId: sId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", id] });
    },
  });

  const enrollMultiple = async () => {
    if (!selectedStudentIds.length) return;
    try {
      await Promise.all(selectedStudentIds.map(sId => adminEnrollStudent({ courseId: id!, studentId: sId })));
      toast.success(`${selectedStudentIds.length} student(s) enrolled successfully`);
      setSelectedStudentIds([]);
      setStudentSearch("");
      qc.invalidateQueries({ queryKey: ["course", id] });
    } catch {
      toast.error("Some enrollments failed");
    }
  };

  const unenroll = useMutation({
    mutationFn: unenrollStudent,
    onSuccess: () => {
      toast.success("Student removed from course");
      qc.invalidateQueries({ queryKey: ["course", id] });
    },
  });

  const editCourse = useMutation({
    mutationFn: updateCourse,
    onSuccess: () => {
      toast.success("Course updated");
      qc.invalidateQueries({ queryKey: ["course", id] });
      setShowEdit(false);
    },
  });

  const endCourse = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      toast.success("Course and all related data deleted");
      navigate("/admin/courses");
    },
  });

  const updateSubject = useMutation({
    mutationFn: (data: { id: string; name: string }) =>
      API.patch(`/courses/subjects/${data.id}`, { name: data.name }),
    onSuccess: () => {
      toast.success("Subject updated");
      qc.invalidateQueries({ queryKey: ["course", id] });
      setShowEditSubject(false);
    },
  });

  const deleteSubject = useMutation({
    mutationFn: (sid: string) => API.delete(`/courses/subjects/${sid}`),
    onSuccess: () => {
      toast.success("Subject deleted");
      qc.invalidateQueries({ queryKey: ["course", id] });
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* BACK BUTTON & ACTIONS */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate("/admin/courses")}
          className="flex items-center gap-2 text-gray-500 hover:text-[rgb(var(--primary))] font-bold transition-colors"
        >
          <ChevronLeft size={20} /> Back to Courses
        </button>

        {isAdmin() && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditData({
                  name: course?.name || "",
                  description: course?.description || "",
                });
                setShowEdit(true);
              }}
              className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-all"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => setShowEndCourseModal(true)}
              className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-all flex items-center gap-2 font-bold text-sm"
              title="End Course"
            >
              <Trash2 size={20} /> <span className="hidden lg:inline">End Course</span>
            </button>
            <button 
              onClick={() => setShowSubject(true)}
              className="px-6 py-3 bg-[rgb(var(--primary))] text-white font-bold rounded-2xl shadow-lg shadow-[rgb(var(--primary))]/20 flex items-center gap-2 hover:scale-[1.02] transition-all"
            >
              <Plus size={20} /> Add Subject
            </button>
          </div>
        )}
      </div>

      {/* HERO SECTION */}
      <div className="p-8 md:p-12 text-white rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] shadow-xl shadow-[rgb(var(--primary))]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <BookOpen size={14} className="mr-2" /> Course Overview
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{course?.name}</h1>
            <p className="opacity-90 font-medium max-w-2xl text-lg leading-relaxed">
              {course?.description || "Detailed overview and management for this academic program."}
            </p>
          </div>

          <div className="flex gap-4 bg-black/10 backdrop-blur-sm p-4 rounded-[2rem] border border-white/10">
            <StatItem icon={<Users size={20} />} label="Students" value={analytics?.data?.studentsCount || 0} />
            <div className="w-px h-10 bg-white/10 my-auto" />
            <StatItem icon={<Layers size={20} />} label="Subjects" value={analytics?.data?.subjectsCount || 0} />
            <div className="w-px h-10 bg-white/10 my-auto" />
            <StatItem icon={<TrendingUp size={20} />} label="Success" value={`${analytics?.data?.performance || 0}%`} />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-3xl w-fit">
        {[
          { id: "subjects", label: "Curriculum", icon: <Layers size={18} /> },
          { id: "students", label: "Enrolled Students", icon: <GraduationCap size={18} /> }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setParams({ tab: t.id })}
            className={`flex items-center gap-2 px-8 py-3 rounded-[1.25rem] font-bold text-sm transition-all ${
              tab === t.id 
                ? "bg-white dark:bg-gray-700 text-[rgb(var(--primary))] shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-h-[400px]"
        >
          {tab === "subjects" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subjects.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
                  <p className="text-gray-400 font-bold text-xl">No subjects added yet.</p>
                </div>
              ) : (
                subjects.map((s: any, index: number) => (
                  <SubjectCard 
                    key={s._id} 
                    subject={s} 
                    teachers={teachers}
                    onEdit={() => {
                      setEditingSubject(s);
                      setShowEditSubject(true);
                    }}
                    onDelete={() => {
                      if (confirm("Delete this subject?")) deleteSubject.mutate(s._id);
                    }}
                    onManageTeachers={() => {
                      setManagingTeachersFor(s);
                      setSelectedTeachers(s.teachers?.map((t: any) => t._id) || []);
                    }}
                    index={index}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* MANUAL ENROLLMENT */}
              {isAdmin() && (
                <div className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manual Enrollment</label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                        {selectedStudentIds.length > 0 ? (
                          <span className="text-[rgb(var(--primary))] font-bold">{selectedStudentIds.length} student(s) selected</span>
                        ) : ("Select students to enroll")}
                      </p>
                    </div>
                    <button
                      disabled={!selectedStudentIds.length}
                      onClick={enrollMultiple}
                      className="px-6 py-3 bg-[rgb(var(--primary))] text-white font-black rounded-2xl shadow-xl shadow-[rgb(var(--primary))]/20 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:scale-100 flex items-center gap-2"
                    >
                      <Plus size={18} /> Enroll ({selectedStudentIds.length})
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students by name or email..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none text-sm font-medium focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
                    />
                  </div>

                  {/* Student Checkbox List */}
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {users?.data
                      ?.filter((u: any) =>
                        u.role === "student" &&
                        !students.some((enrolled: any) => enrolled._id === u._id) &&
                        (u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(studentSearch.toLowerCase()))
                      )
                      .map((s: any) => (
                        <label
                          key={s._id}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(s._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds(prev => [...prev, s._id]);
                              } else {
                                setSelectedStudentIds(prev => prev.filter(id => id !== s._id));
                              }
                            }}
                            className="w-4 h-4 text-[rgb(var(--primary))] rounded-md border-gray-300 focus:ring-[rgb(var(--primary))]/20"
                          />
                          <img
                            src={getFileUrl(s.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&size=40`}
                            className="w-8 h-8 rounded-xl object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{s.name}</p>
                            <p className="text-xs text-gray-400 truncate">{s.email}</p>
                          </div>
                        </label>
                      ))}
                    {users?.data?.filter((u: any) =>
                      u.role === "student" &&
                      !students.some((enrolled: any) => enrolled._id === u._id) &&
                      (u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(studentSearch.toLowerCase()))
                    ).length === 0 && (
                      <p className="text-center text-sm text-gray-400 py-6 font-medium">No students available to enroll.</p>
                    )}
                  </div>
                </div>
              )}

              {/* STUDENT LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-gray-400 font-bold text-xl">No students enrolled yet.</p>
                  </div>
                ) : (
                  students.map((s: any) => (
                    <motion.div 
                      key={s._id} 
                      layout
                      className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-[rgb(var(--primary))]/5 transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={getFileUrl(s.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&size=100`}
                          className="w-16 h-16 rounded-3xl object-cover shadow-sm border-2 border-white dark:border-gray-800"
                        />
                        <div>
                          <h3 className="font-black text-gray-800 dark:text-white text-lg">{s.name}</h3>
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <Mail size={12} /> {s.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> Active Enrollment
                        </span>

                        {isAdmin() && (
                          <button
                            onClick={() => setStudentToUnenroll(s)}
                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                          >
                            <UserMinus size={20} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODALS */}
      <Modal isOpen={showSubject} onClose={() => setShowSubject(false)} title="Add New Subject">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Subject Name</label>
            <input
              autoFocus
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Advanced Mathematics"
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold"
            />
          </div>
          <button
            onClick={() => addSubject.mutate({ courseId: id!, name: subjectName })}
            className="w-full py-4 bg-[rgb(var(--primary))] text-white font-black rounded-2xl shadow-xl shadow-[rgb(var(--primary))]/20 transition-all hover:opacity-90 active:scale-95"
          >
            Create Subject
          </button>
        </div>
      </Modal>

      <Modal isOpen={showEditSubject} onClose={() => setShowEditSubject(false)} title="Edit Subject">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Subject Name</label>
            <input
              value={editingSubject?.name || ""}
              onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold"
            />
          </div>
          <button
            onClick={() => updateSubject.mutate({ id: editingSubject._id, name: editingSubject.name })}
            className="w-full py-4 bg-[rgb(var(--primary))] text-white font-black rounded-2xl shadow-xl shadow-[rgb(var(--primary))]/20 transition-all hover:opacity-90 active:scale-95"
          >
            Update Subject
          </button>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Course Details">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Course Name</label>
            <input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
            <textarea
              rows={4}
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold resize-none"
            />
          </div>
          <button
            onClick={() => editCourse.mutate({ id: id!, ...editData })}
            className="w-full py-4 bg-[rgb(var(--primary))] text-white font-black rounded-2xl shadow-xl shadow-[rgb(var(--primary))]/20 transition-all hover:opacity-90 active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Confirmation Modal for Unenrollment */}
      <Modal 
        isOpen={!!studentToUnenroll} 
        onClose={() => setStudentToUnenroll(null)} 
        title="Remove Student"
      >
        <div className="space-y-6">
          <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            Are you sure you want to remove <span className="text-gray-800 dark:text-white font-bold">{studentToUnenroll?.name}</span> from this course? This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setStudentToUnenroll(null)}
              className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                unenroll.mutate({ courseId: id!, studentId: studentToUnenroll._id });
                setStudentToUnenroll(null);
              }}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>
      {/* Manage Instructors Modal */}
      <Modal
        isOpen={!!managingTeachersFor}
        onClose={() => setManagingTeachersFor(null)}
        title="Manage Instructors"
      >
        <div className="space-y-6">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
            Select the teachers who should have access to {managingTeachersFor?.name}:
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {teachers.map((t: any) => (
              <label
                key={t._id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTeachers.includes(t._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTeachers([...selectedTeachers, t._id]);
                    } else {
                      setSelectedTeachers(selectedTeachers.filter((id) => id !== t._id));
                    }
                  }}
                  className="w-5 h-5 text-[rgb(var(--primary))] bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-[rgb(var(--primary))]/20"
                />
                <span className="font-bold text-gray-700 dark:text-gray-300">{t.name}</span>
              </label>
            ))}
          </div>
          <button
            onClick={() => {
              assign.mutate({ subjectId: managingTeachersFor._id, teacherIds: selectedTeachers });
              setManagingTeachersFor(null);
            }}
            className="w-full py-4 bg-[rgb(var(--primary))] text-white font-black rounded-2xl shadow-xl shadow-[rgb(var(--primary))]/20 transition-all hover:opacity-90 active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </Modal>

      {/* End Course Confirmation Modal */}
      <Modal 
        isOpen={showEndCourseModal} 
        onClose={() => setShowEndCourseModal(false)} 
        title="End Academic Course"
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
            <p className="text-red-600 dark:text-red-400 text-sm font-bold leading-relaxed">
              ⚠️ Warning: Ending this course will permanently delete all subjects, assignments, and student submissions associated with it. This action is irreversible.
            </p>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            Are you sure you want to end <span className="text-gray-800 dark:text-white font-bold">{course?.name}</span>?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowEndCourseModal(false)}
              className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => endCourse.mutate(id!)}
              disabled={endCourse.isPending}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50"
            >
              {endCourse.isPending ? "Ending..." : "Confirm End"}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

/* SUB-COMPONENTS */

function StatItem({ icon, label, value }: any) {
  return (
    <div className="flex flex-col items-center px-4">
      <div className="flex items-center gap-2 opacity-60 mb-1">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function SubjectCard({ subject, onEdit, onDelete, onManageTeachers, index }: any) {
  const code = subject.code || `${subject.name.substring(0, 4).toUpperCase()}-${100 + index}`;
  
  return (
    <motion.div 
      layout
      className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-[rgb(var(--primary))]/5 transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <div className="inline-flex px-3 py-1 bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] rounded-lg text-[10px] font-black tracking-widest uppercase">
            {code}
          </div>
          <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">{subject.name}</h3>
        </div>
        
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/5 rounded-xl transition-all">
            <Edit3 size={18} />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instructors</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {subject.teachers?.length > 0 
                ? subject.teachers.map((t: any) => t.name).join(", ") 
                : "Unassigned"}
            </p>
          </div>
        </div>

        {isAdmin() && (
          <button
            onClick={onManageTeachers}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[rgb(var(--primary))] font-bold rounded-xl text-xs hover:bg-[rgb(var(--primary))]/10 transition-colors"
          >
            Manage
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Modal({ isOpen, children, onClose, title }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{title}</h2>
              <button onClick={onClose} className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}