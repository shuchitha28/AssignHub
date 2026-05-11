import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReportCardData } from "../../api/assignment.api";
import { 
  Download, 
  Search, 
  Filter, 
  BarChart3,
  TrendingUp,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export default function ReportCard() {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["report-card-data"],
    queryFn: getReportCardData,
  });

  const assignments = reportData?.data?.assignments || [];
  const allSubmissions = reportData?.data?.submissions || [];

  // 1. Extract unique subjects and filter assignments
  const { subjects, assignmentsMap } = useMemo(() => {
    const subsMap = new Map<string, { id: string, name: string, course: string }>();
    const assignMap: Record<string, any[]> = {};

    assignments.forEach((a: any) => {
      const subId = a.subject?._id || "unknown";
      const subjectName = a.subject?.name || "Unknown Subject";
      const courseName = a.course?.name || "Unknown Course";
      
      if (!subsMap.has(subId)) {
        subsMap.set(subId, { id: subId, name: subjectName, course: courseName });
      }

      if (!assignMap[subId]) {
        assignMap[subId] = [];
      }
      assignMap[subId].push(a);
    });

    return { 
      subjects: Array.from(subsMap.values()).sort((a, b) => a.name.localeCompare(b.name)), 
      assignmentsMap: assignMap 
    };
  }, [assignments]);

  // 2. Get current assignment details
  const currentAssignment = useMemo(() => {
    if (selectedAssignmentId === "all") return null;
    return assignments.find((a: any) => a._id === selectedAssignmentId);
  }, [selectedAssignmentId, assignments]);

  // 3. Process flat data for all student-assignment pairs
  const processedData = useMemo(() => {
    let targetAssignments = [];
    if (selectedAssignmentId !== "all") {
      if (currentAssignment) targetAssignments = [currentAssignment];
    } else {
      targetAssignments = assignments.filter((a: any) => 
        selectedSubject === "all" || a.subject?._id === selectedSubject
      );
    }

    if (targetAssignments.length === 0) return [];

    const result: any[] = [];
    targetAssignments.forEach((assignment: any) => {
      const enrolledStudents = assignment.course?.students || [];
      enrolledStudents.forEach((student: any) => {
        if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) return;

        const submission = allSubmissions.find(
          (s: any) => {
            const sId = s.student?._id || s.student;
            const stuId = student._id || student;
            const aId = s.assignment?._id || s.assignment;
            const tId = assignment._id;
            return String(sId) === String(stuId) && String(aId) === String(tId);
          }
        );

        result.push({
          student,
          status: submission ? submission.status : "not_submitted",
          marks: submission ? submission.marks : null,
          assignment: assignment,
          hasSubmitted: !!submission
        });
      });
    });

    return result;
  }, [currentAssignment, selectedAssignmentId, selectedSubject, assignments, allSubmissions, searchTerm]);

  // 4. Matrix Grouping: Subject -> Assignments List & Students Map with scores
  const subjectGradebook = useMemo(() => {
    const subjectsMap: Record<string, {
      assignments: any[],
      students: Record<string, { student: any, scores: Record<string, number | null>, submittedCount: number }>,
      teachers: string[],
      totalStudents: number,
      totalMaxMarks: number
    }> = {};

    processedData.forEach(item => {
      const subjectObj = item.assignment?.subject;
      const subjectName = subjectObj?.name || "Uncategorized";
      const courseName = item.assignment?.course?.name || "";
      const displayKey = `${subjectName}${courseName ? ` (${courseName})` : ''}`;
      
      const assignmentId = item.assignment?._id.toString();
      const studentId = item.student?._id.toString();

      if (!subjectsMap[displayKey]) {
        subjectsMap[displayKey] = { 
          assignments: [], 
          students: {}, 
          teachers: subjectObj?.teachers?.map((t: any) => t.name) || [],
          totalStudents: item.assignment?.course?.students?.length || 0,
          totalMaxMarks: 0
        };
      }

      if (!subjectsMap[displayKey].assignments.find(a => a._id.toString() === assignmentId)) {
        subjectsMap[displayKey].assignments.push(item.assignment);
        subjectsMap[displayKey].totalMaxMarks += (item.assignment?.totalMarks || 0);
      }

      if (!subjectsMap[displayKey].students[studentId]) {
        subjectsMap[displayKey].students[studentId] = { 
          student: item.student, 
          scores: {},
          submittedCount: 0
        };
      }
      subjectsMap[displayKey].students[studentId].scores[assignmentId] = item.marks;
      if (item.hasSubmitted) {
        subjectsMap[displayKey].students[studentId].submittedCount += 1;
      }
    });

    // Sort students by name within each subject and calculate subject-level stats
    Object.keys(subjectsMap).forEach(key => {
      const subjectData = subjectsMap[key];
      const sortedStudents = Object.values(subjectData.students).sort((a, b) => 
        (a.student?.name || "").localeCompare(b.student?.name || "")
      );
      
      // Calculate Average Score for the subject
      let totalEarned = 0;
      let scoreCount = 0;
      sortedStudents.forEach(s => {
        Object.values(s.scores).forEach(score => {
          if (score !== null && score !== undefined) {
            totalEarned += score;
            scoreCount++;
          }
        });
      });
      
      const avgScore = scoreCount > 0 ? (totalEarned / (sortedStudents.length * subjectData.totalMaxMarks)) * 100 : 0;
      (subjectData as any).averagePercentage = Math.round(avgScore);
      (subjectData as any).totalEarnedMarks = totalEarned;

      subjectsMap[key].students = sortedStudents.reduce((acc, curr) => {
        acc[curr.student._id.toString()] = curr;
        return acc;
      }, {} as any);
      
      (subjectsMap[key] as any).sortedStudents = sortedStudents;
    });

    return subjectsMap;
  }, [processedData]);

  // 5. Stats calculation
  const stats = useMemo(() => {
    const totalEntries = processedData.length;
    const submittedCount = processedData.filter(d => d.hasSubmitted).length;
    const reviewed = processedData.filter(d => d.status === "reviewed").length;
    const reviewedScores = processedData.filter(d => d.status === "reviewed" && d.marks !== null);
    const avgScore = reviewedScores.length > 0 
      ? Math.round(reviewedScores.reduce((acc, curr) => acc + (curr.marks / (curr.assignment?.totalMarks || 100)) * 100, 0) / reviewedScores.length)
      : 0;

    return { totalEntries, submittedCount, reviewed, avgScore };
  }, [processedData]);

  // 6. PDF Export
  const downloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const timestamp = format(new Date(), "PPpp");
    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
    const secondaryColor: [number, number, number] = [30, 41, 59]; // Slate

    // --- PAGE 1: HEADER BANNER ---
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(0, 0, 297, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("ASSIGNHUB ACADEMIC GRADEBOOK", 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Official Academic Report • Generated: ${timestamp}`, 14, 32);

    // Global Stats Row
    let currentY = 55;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 269, 25, 3, 3, 'F');
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("GLOBAL PERFORMANCE SUMMARY", 20, currentY + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`TOTAL SUBJECTS: ${Object.keys(subjectGradebook).length}`, 20, currentY + 16);
    doc.text(`OVERALL AVG SCORE: ${stats.avgScore}%`, 80, currentY + 16);
    doc.text(`TOTAL STUDENTS: ${stats.totalEntries > 0 ? Object.keys(Object.values(subjectGradebook)[0]?.students || {}).length : 0}`, 150, currentY + 16);
    doc.text(`TOTAL SUBMISSIONS: ${stats.submittedCount}`, 220, currentY + 16);

    currentY += 40;

    Object.entries(subjectGradebook).forEach(([subject, data]) => {
      if (currentY > 160) { doc.addPage(); currentY = 20; }
      
      // Subject Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(14, currentY, 4, 12, 'F');
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(subject.toUpperCase(), 22, currentY + 9);
      
      currentY += 18;

      // Subject Analytics Bar
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const teacherNames = data.teachers.length > 0 ? data.teachers.join(", ") : "Unassigned";
      doc.text(`INSTRUCTORS: ${teacherNames}`, 14, currentY);
      currentY += 6;

      const totalSubmissions = Object.values(data.students).reduce((acc, s) => acc + s.submittedCount, 0);
      const totalPossible = data.totalStudents * data.assignments.length;
      
      doc.setFont("helvetica", "bold");
      doc.text(`CLASS AVERAGE: ${(data as any).averagePercentage}%`, 14, currentY);
      doc.text(`SUBMISSION RATE: ${totalPossible > 0 ? Math.round((totalSubmissions / totalPossible) * 100) : 0}%`, 60, currentY);
      doc.text(`MAX POINTS: ${data.totalMaxMarks}`, 120, currentY);
      
      currentY += 10;

      const headers = ['STUDENT NAME', ...data.assignments.map(a => `${a.title.toUpperCase()}\n(${a.totalMarks})`), `TOTAL\n(${data.totalMaxMarks})` ];
      const body = ((data as any).sortedStudents || []).map((s: any) => {
        const studentRow = [s.student?.name || 'N/A'];
        let earned = 0;

        data.assignments.forEach(a => {
          const aId = a?._id?.toString() || '';
          const score = s.scores[aId];
          studentRow.push((score !== null && score !== undefined) ? score.toString() : '-');
          earned += (score || 0);
        });

        studentRow.push(earned.toString());
        return studentRow;
      });

      autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: body,
        theme: 'grid',
        headStyles: { 
          fillColor: secondaryColor, 
          fontSize: 7, 
          halign: 'center', 
          valign: 'middle',
          fontStyle: 'bold'
        },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [250, 250, 252] as [number, number, number] },
        margin: { left: 14, right: 14 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 25;
    });

    // Footer on every page would be nice but let's keep it simple for now
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount} • AssignHub Gradebook System`, 148, 200, { align: 'center' });
    }

    doc.save(`AssignHub_Gradebook_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">Gradebook Center</h1>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" />
              Consolidated Student Performance Matrix
            </p>
          </div>
        </div>
        
        <button 
          onClick={downloadPDF}
          className="flex items-center gap-2 px-6 py-3.5 bg-[rgb(var(--primary))] text-white font-bold rounded-2xl shadow-lg shadow-[rgb(var(--primary))]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Download size={20} />
          Export Gradebook
        </button>
      </div>

      {/* TOP FILTERS & PERFORMANCE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* FILTERS HORIZONTAL */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
           <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs min-w-[100px]">
                <Filter size={16} /> Filters
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <select 
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedAssignmentId("all");
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-700 dark:text-gray-300 transition-all text-sm"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.course})</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <select 
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-700 dark:text-gray-300 transition-all text-sm"
                >
                  <option value="all">All Assignments</option>
                  {selectedSubject !== "all" && assignmentsMap[selectedSubject]?.map((a: any) => (
                    <option key={a._id} value={a._id}>{a.title}</option>
                  ))}
                  {selectedSubject === "all" && assignments.map((a: any) => (
                    <option key={a._id} value={a._id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[250px] relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Find student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm transition-all"
                />
              </div>
           </div>
        </div>

        {/* CLASS PERFORMANCE CARD -> CHANGED TO SUBMISSION RATE */}
        <div className="lg:col-span-1 bg-gradient-to-br from-gray-900 to-black rounded-[2rem] p-6 text-white shadow-xl flex flex-col justify-center">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} /> Submission Rate
              </h3>
              <span className="text-xl font-black text-blue-400">
                {stats.totalEntries > 0 ? Math.round((stats.submittedCount / stats.totalEntries) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.totalEntries > 0 ? (stats.submittedCount / stats.totalEntries) * 100 : 0}%` }}
                className="h-full bg-blue-400"
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-gray-500 uppercase font-bold tracking-widest opacity-60">
              <span>{stats.submittedCount} Submitted</span>
              <span>{stats.totalEntries - stats.submittedCount} Pending</span>
            </div>
        </div>
      </div>

      {/* GRADEBOOK MAIN CONTENT */}
      <div className="space-y-12">
        {Object.entries(subjectGradebook).map(([subjectName, data]) => (
          <div key={subjectName} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-primary rounded-full shadow-lg shadow-primary/40" />
                <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">{subjectName}</h2>
              </div>
              <div className="flex gap-2">
                 <div className="px-4 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-400 shadow-sm">
                  {data.assignments.length} ASSIGNMENTS
                 </div>
                 <div className="px-4 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-400 shadow-sm">
                  {Object.keys(data.students).length} STUDENTS
                 </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[rgb(var(--primary))] text-white">
                    <th className="px-8 py-5 text-[10px] font-bold text-white uppercase tracking-widest sticky left-0 bg-[rgb(var(--primary))] z-10">Student Name</th>
                    {data.assignments.map(a => (
                      <th key={a._id} className="px-8 py-5 text-[10px] font-bold text-white/70 uppercase tracking-widest text-center border-l border-white/10">
                        <p className="truncate max-w-[120px] mx-auto text-white">{a.title}</p>
                        <p className="text-[8px] text-white/60 mt-1 font-black">MAX: {a.totalMarks}</p>
                      </th>
                    ))}
                    <th className="px-8 py-5 text-[10px] font-bold text-white uppercase tracking-widest text-right bg-black/10 border-l border-white/10">
                      Total Performance
                      <p className="text-[8px] text-white/60 mt-1">MAX: {data.assignments.reduce((acc, a) => acc + (a.totalMarks || 0), 0)}</p>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {((data as any).sortedStudents || []).map((s: any) => {
                    let earned = 0;
                    return (
                      <tr key={s.student?._id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-8 py-5 sticky left-0 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-colors z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                              {s.student?.name?.charAt(0)}
                            </div>
                            <span className="font-bold text-gray-800 dark:text-white whitespace-nowrap">{s.student?.name}</span>
                          </div>
                        </td>
                        {data.assignments.map(a => {
                          const aId = a?._id?.toString() || '';
                          const score = s.scores[aId];
                          earned += (score || 0);
                          return (
                            <td key={a._id} className="px-8 py-5 text-center border-l border-gray-50 dark:border-gray-800/50">
                              {(score !== null && score !== undefined) ? (
                                <span className="font-black text-gray-800 dark:text-white">{score}</span>
                              ) : (
                                <span className="text-gray-300 font-bold">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-8 py-5 text-right bg-primary/5 border-l border-primary/10">
                          <span className="font-black text-primary">{earned}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {Object.keys(subjectGradebook).length === 0 && (
          <div className="bg-white dark:bg-gray-900 p-20 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-6">
              <Target size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Gradebook Data Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your filters or search terms to find the records you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}