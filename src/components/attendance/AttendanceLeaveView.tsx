import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Filter,
  Download,
  Printer,
  ShieldCheck,
  UserCheck,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Lock,
  Split,
  BookOpen,
  Info,
  ChevronDown,
  User,
  CheckSquare,
  Square,
  FileText,
  Activity,
  HeartPulse,
  Award,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/db';
import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceClearance,
  Student,
  ClassRoom,
  Subject,
  Teacher,
  TimetablePeriodDefinition,
  TimetableSlot,
  DayOfWeek,
} from '../../types';
import { calculateStudentSubjectAttendance } from '../../utils/attendanceCalculator';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const AttendanceLeaveView: React.FC = () => {
  const { currentUser } = useAuth();
  const user = currentUser;
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isSuperAdmin = user?.role === 'super_admin';

  const [dbState, setDbState] = useState(() => dataService.getState());
  const [activeTab, setActiveTab] = useState<'mark' | 'summary' | 'clearance' | 'split-subjects'>('mark');

  // Selected date (Defaults to Today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Toggle: Show All Assigned Subjects (Includes other days & unscheduled)
  const [showAllSubjects, setShowAllSubjects] = useState<boolean>(false);

  // Active Subject and Period Selection
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);

  // For Super Admin: teacher selector (defaults to first teacher or current user)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  // Search filter for students
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // Local in-memory session status map: studentId -> boolean (true = present, false = casual_leave)
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({});
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Clearance Modal State
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [clearanceTargetStudentId, setClearanceTargetStudentId] = useState<string>('');
  const [clearanceTargetSubjectId, setClearanceTargetSubjectId] = useState<string>('ALL');
  const [clearanceApprovedPercentage, setClearanceApprovedPercentage] = useState<number>(85);
  const [clearanceRemarks, setClearanceRemarks] = useState<string>('');

  // Leave Conversion Modal State (for Academic, Official, Medical leave conversion by HoD/Academic Assistant)
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [conversionTargetRecord, setConversionTargetRecord] = useState<AttendanceRecord | null>(null);
  const [conversionTargetStatus, setConversionTargetStatus] = useState<'academic_leave' | 'official_leave' | 'medical_leave'>('academic_leave');
  const [conversionReason, setConversionReason] = useState<string>('');

  // Split Elective Enrollment Modal State
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [enrollmentSubjectId, setEnrollmentSubjectId] = useState<string>('');
  const [tempEnrolledStudentIds, setTempEnrolledStudentIds] = useState<string[]>([]);

  // Print view state
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  // Summary filter state
  const [summaryClassId, setSummaryClassId] = useState<string>('class-8a');
  const [summarySubjectId, setSummarySubjectId] = useState<string>('ALL');

  useEffect(() => {
    return dataService.subscribe(() => {
      setDbState(dataService.getState());
    });
  }, []);

  const students = dbState.students || [];
  const subjects = dbState.subjects || [];
  const classes = dbState.classes || [];
  const teachers = dbState.teachers || [];
  const attendanceRecords = dbState.attendanceRecords || [];
  const clearances = dbState.attendanceClearances || [];
  const rules = dbState.attendanceRules;
  const periods = useMemo(() => {
    return (dbState.timetablePeriods || []).slice().sort((a, b) => a.periodNumber - b.periodNumber);
  }, [dbState.timetablePeriods]);

  // Determine active teacher object
  const currentTeacherObj = useMemo(() => {
    if (isTeacher) {
      return (
        teachers.find(
          (t) => t.id === user?.id || t.username === user?.name || `user-${t.id}` === user?.id
        ) || teachers[0]
      );
    }
    if (isSuperAdmin) {
      if (selectedTeacherId) {
        return teachers.find((t) => t.id === selectedTeacherId) || teachers[0];
      }
      return teachers[0];
    }
    return null;
  }, [teachers, user, isTeacher, isSuperAdmin, selectedTeacherId]);

  // Set default teacher ID for super admin
  useEffect(() => {
    if (isSuperAdmin && !selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [isSuperAdmin, selectedTeacherId, teachers]);

  // Day of week derived from selectedDate
  const currentDayOfWeek: DayOfWeek = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    const dayIndex = d.getDay();
    return DAYS_OF_WEEK[dayIndex] || 'Monday';
  }, [selectedDate]);

  // Check if current user is an authorized clearance authority (Academic Assistant, HoD, HoS, Principal, Super Admin)
  const canGrantClearance = useMemo(() => {
    if (isSuperAdmin || user?.role === 'super_admin') return true;
    if (currentTeacherObj) {
      const allowedRoles = rules?.clearanceAllowedRoles || [
        'super_admin',
        'Principal',
        'HoD',
        'HoS',
        'Academic Assistant',
      ];
      const title = currentTeacherObj.specialRoleTitle?.toLowerCase() || '';
      if (allowedRoles.some((r) => title.includes(r.toLowerCase()))) {
        return true;
      }
      if (rules?.clearanceTeacherIds?.includes(currentTeacherObj.id)) return true;
    }
    // Also check current user's role/name
    const userRoleStr = (user?.role || '').toLowerCase();
    const userNameStr = (user?.name || '').toLowerCase();
    if (
      userRoleStr.includes('admin') ||
      userRoleStr.includes('hod') ||
      userRoleStr.includes('assistant') ||
      userNameStr.includes('hod') ||
      userNameStr.includes('academic assistant')
    ) {
      return true;
    }
    return false;
  }, [isSuperAdmin, user, currentTeacherObj, rules]);

  // All subjects assigned to the effective teacher
  const teacherAllAssignedSubjects = useMemo(() => {
    if (!currentTeacherObj) {
      return subjects.filter((s) => s.status !== 'inactive' && s.trackAttendance !== false);
    }
    return subjects.filter((s) => {
      if (s.status === 'inactive' || s.trackAttendance === false) return false;
      if (isSuperAdmin && !selectedTeacherId) return true;
      if (s.assignedTeacherId === currentTeacherObj.id) return true;
      if (s.additionalTeacherIds?.includes(currentTeacherObj.id)) return true;
      if (currentTeacherObj.assignedSubjectIds?.includes(s.id)) return true;
      if (currentTeacherObj.canManageAllAttendance) return true;
      return false;
    });
  }, [subjects, currentTeacherObj, isSuperAdmin, selectedTeacherId]);

  // Timetable slots for this teacher today
  const teacherTodayScheduledSlots = useMemo(() => {
    const slots = dbState.timetableSlots || [];
    if (!currentTeacherObj) return [];
    return slots.filter((slot) => {
      if (slot.dayOfWeek !== currentDayOfWeek) return false;
      // Match by teacher ID directly or subject assigned to this teacher
      const slotSubject = subjects.find((s) => s.id === slot.subjectId);
      if (!slotSubject || slotSubject.trackAttendance === false) return false;

      const isTeacherSlot =
        slot.teacherId === currentTeacherObj.id ||
        slotSubject.assignedTeacherId === currentTeacherObj.id ||
        slotSubject.additionalTeacherIds?.includes(currentTeacherObj.id);

      return isTeacherSlot;
    }).sort((a, b) => a.periodNumber - b.periodNumber);
  }, [dbState.timetableSlots, currentDayOfWeek, currentTeacherObj, subjects]);

  // Available subjects to display in the selector:
  // When showAllSubjects is FALSE: Only subjects scheduled for today!
  // When showAllSubjects is TRUE: All assigned subjects of that teacher across all days!
  const visibleSubjectsToMark = useMemo(() => {
    if (!showAllSubjects) {
      // Return subjects scheduled for today
      // Extract unique subjects from today's slots
      const subjectMap = new Map<string, Subject>();
      teacherTodayScheduledSlots.forEach((slot) => {
        const sub = subjects.find((s) => s.id === slot.subjectId);
        if (sub) subjectMap.set(sub.id, sub);
      });
      return Array.from(subjectMap.values());
    } else {
      // Return all assigned subjects
      return teacherAllAssignedSubjects;
    }
  }, [showAllSubjects, teacherTodayScheduledSlots, teacherAllAssignedSubjects, subjects]);

  // Auto-select subject and period if not selected or invalid
  useEffect(() => {
    if (!showAllSubjects && teacherTodayScheduledSlots.length > 0) {
      const currentSelectedStillValid = teacherTodayScheduledSlots.some(
        (s) => s.subjectId === selectedSubjectId && s.periodNumber === selectedPeriod
      );
      if (!currentSelectedStillValid) {
        setSelectedSubjectId(teacherTodayScheduledSlots[0].subjectId);
        setSelectedPeriod(teacherTodayScheduledSlots[0].periodNumber);
      }
    } else if (visibleSubjectsToMark.length > 0) {
      const exists = visibleSubjectsToMark.some((s) => s.id === selectedSubjectId);
      if (!exists) {
        setSelectedSubjectId(visibleSubjectsToMark[0].id);
      }
    }
  }, [
    showAllSubjects,
    teacherTodayScheduledSlots,
    visibleSubjectsToMark,
    selectedSubjectId,
    selectedPeriod,
  ]);

  // Active Subject Object
  const currentSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId);
  }, [subjects, selectedSubjectId]);

  // Class of active subject
  const currentClass = useMemo(() => {
    if (!currentSubject) return null;
    return classes.find((c) => c.id === currentSubject.classId);
  }, [classes, currentSubject]);

  // Students of current subject (respecting split subject enrollment)
  const currentSubjectStudents = useMemo(() => {
    if (!currentSubject) return [];
    const list = students.filter(
      (s) => s.classId === currentSubject.classId && s.status === 'active'
    );
    if (currentSubject.isSplitSubject) {
      const enrolled = currentSubject.enrolledStudentIds || [];
      return list.filter((s) => enrolled.includes(s.id));
    }
    return list;
  }, [students, currentSubject]);

  // Filtered students based on search query
  const displayedStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return currentSubjectStudents;
    const q = studentSearchQuery.toLowerCase();
    return currentSubjectStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
    );
  }, [currentSubjectStudents, studentSearchQuery]);

  // Attendance records for current session (date + class + subject + period)
  const currentSessionRecords = useMemo(() => {
    if (!currentSubject) return [];
    return attendanceRecords.filter(
      (r) =>
        r.date === selectedDate &&
        r.classId === currentSubject.classId &&
        r.subjectId === selectedSubjectId &&
        r.period === selectedPeriod
    );
  }, [attendanceRecords, selectedDate, currentSubject, selectedSubjectId, selectedPeriod]);

  // Initialize in-memory presentMap when session changes or records update
  useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    if (currentSessionRecords.length > 0) {
      // Existing records: present if status is present or academic_leave
      currentSubjectStudents.forEach((student) => {
        const rec = currentSessionRecords.find((r) => r.studentId === student.id);
        if (rec) {
          initialMap[student.id] = rec.status === 'present' || rec.status === 'academic_leave';
        } else {
          initialMap[student.id] = false; // Default unchecked is casual leave
        }
      });
    } else {
      // Fresh session: default all students to present for speed, or user can toggle/untoggle
      currentSubjectStudents.forEach((student) => {
        initialMap[student.id] = true;
      });
    }
    setPresentMap(initialMap);
    setSubmitFeedback(null);
  }, [selectedSubjectId, selectedPeriod, selectedDate, currentSubjectStudents.length, currentSessionRecords.length]);

  // Check if session is already saved in DB
  const isSessionAlreadySaved = currentSessionRecords.length > 0;

  // Toggle single student present checkbox
  const handleToggleStudentPresent = (studentId: string) => {
    setPresentMap((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    const next: Record<string, boolean> = {};
    currentSubjectStudents.forEach((s) => {
      next[s.id] = true;
    });
    setPresentMap(next);
  };

  // Uncheck all (all become Casual Leave)
  const handleUncheckAll = () => {
    const next: Record<string, boolean> = {};
    currentSubjectStudents.forEach((s) => {
      next[s.id] = false;
    });
    setPresentMap(next);
  };

  // Submit attendance for current subject & period
  const handleSubmitAttendance = () => {
    if (!currentSubject || !currentClass) return;

    const recordsToSave = currentSubjectStudents.map((std) => {
      const isPresent = presentMap[std.id] ?? false;
      const status: AttendanceStatus = isPresent ? 'present' : 'casual_leave';
      return {
        studentId: std.id,
        status,
      };
    });

    dataService.savePeriodAttendance({
      date: selectedDate,
      classId: currentClass.id,
      subjectId: currentSubject.id,
      period: selectedPeriod,
      records: recordsToSave,
      markedBy: user?.name || currentTeacherObj?.name || 'Teacher',
    });

    const presentCount = recordsToSave.filter((r) => r.status === 'present').length;
    const casualLeaveCount = recordsToSave.length - presentCount;

    setSubmitFeedback(
      `Attendance saved successfully: ${presentCount} Present, ${casualLeaveCount} Casual Leave.`
    );

    setTimeout(() => {
      setSubmitFeedback(null);
    }, 5000);
  };

  // =========================================================================
  // SUMMARY STATISTICS FOR ACTIVE SUBJECT
  // =========================================================================
  const subjectSummaryStats = useMemo(() => {
    if (!currentSubject) {
      return {
        totalClassesHeld: 0,
        totalEnrolled: 0,
        presentThisSession: 0,
        casualLeaveThisSession: 0,
        sessionRate: 0,
        historicalRate: 0,
      };
    }

    const allSubjectRecords = attendanceRecords.filter(
      (r) => r.subjectId === currentSubject.id
    );

    // Total classes held = distinct sessions (date + period)
    const distinctSessions = new Set(
      allSubjectRecords.map((r) => `${r.date}_P${r.period}`)
    );
    const totalClassesHeld = distinctSessions.size;

    const totalEnrolled = currentSubjectStudents.length;
    const presentThisSession = currentSubjectStudents.filter((s) => presentMap[s.id]).length;
    const casualLeaveThisSession = totalEnrolled - presentThisSession;
    const sessionRate = totalEnrolled > 0 ? Math.round((presentThisSession / totalEnrolled) * 100) : 0;

    // Historical attendance rate across all conducted sessions
    const totalPresentOrAcademic = allSubjectRecords.filter(
      (r) => r.status === 'present' || r.status === 'academic_leave'
    ).length;
    const historicalRate =
      allSubjectRecords.length > 0
        ? Math.round((totalPresentOrAcademic / allSubjectRecords.length) * 100)
        : 100;

    return {
      totalClassesHeld,
      totalEnrolled,
      presentThisSession,
      casualLeaveThisSession,
      sessionRate,
      historicalRate,
    };
  }, [currentSubject, attendanceRecords, currentSubjectStudents, presentMap]);

  // Clearance save handler
  const handleSaveClearance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearanceTargetStudentId) return;

    dataService.grantAttendanceClearance({
      studentId: clearanceTargetStudentId,
      subjectId: clearanceTargetSubjectId === 'ALL' ? undefined : clearanceTargetSubjectId,
      academicYear: dbState.currentAcademicYear || '2025-2026',
      reason: clearanceRemarks || 'Attendance condonation approved by authority',
      approvedPercentage: clearanceApprovedPercentage,
      grantedBy: user?.id || 'admin',
      grantedByName: user?.name || currentTeacherObj?.name || 'Authority',
      grantedByRole: currentTeacherObj?.specialRoleTitle || user?.role || 'HoD / Authority',
    });

    setIsClearanceModalOpen(false);
    setClearanceTargetStudentId('');
    setClearanceRemarks('');
  };

  // Leave conversion save handler (Converting casual leave/absence to Academic, Official, or Medical leave)
  const handleSaveConversion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversionTargetRecord) return;

    dataService.updateAttendanceRecordStatus(
      conversionTargetRecord.id,
      conversionTargetStatus,
      conversionReason || `Converted to ${conversionTargetStatus.replace('_', ' ')}`,
      {
        id: user?.id || 'admin',
        name: user?.name || currentTeacherObj?.name || 'Authority',
        role: currentTeacherObj?.specialRoleTitle || user?.role || 'HoD / Authority',
      }
    );

    setIsConversionModalOpen(false);
    setConversionTargetRecord(null);
    setConversionReason('');
  };

  // Split Subject enrollment save
  const handleSaveEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentSubjectId) return;

    dataService.updateSubjectEnrolledStudents(enrollmentSubjectId, tempEnrolledStudentIds);
    setIsEnrollmentModalOpen(false);
  };

  // Export Attendance Summary to Excel (.xlsx)
  const handleExportExcel = () => {
    const targetStudents = students.filter(
      (s) => s.classId === summaryClassId && s.status === 'active'
    );

    const summaryData = targetStudents.map((student) => {
      const stats = calculateStudentSubjectAttendance(
        student.id,
        summarySubjectId,
        attendanceRecords,
        clearances,
        rules
      );

      return {
        'Admission No': student.admissionNumber,
        'Student Name': student.name,
        Class: classes.find((c) => c.id === summaryClassId)?.name || summaryClassId,
        Subject: summarySubjectId === 'ALL' ? 'All Subjects' : subjects.find((s) => s.id === summarySubjectId)?.name,
        'Total Classes': stats.totalPeriods,
        Present: stats.presentCount,
        'Academic Leave (Present)': stats.academicLeaveCount,
        'Official Leave': stats.officialLeaveCount,
        'Casual Leave': stats.casualLeaveCount,
        'Medical Leave': stats.medicalLeaveCount,
        'Effective Present %': `${stats.effectivePresentPercent}%`,
        'Overall Attendance % (Without Medical)': `${stats.overallPercentWithoutMedical}%`,
        'Status (85% Req)': stats.isCleared
          ? 'Cleared / Condoned'
          : stats.isShortage
          ? 'Shortage (<85%)'
          : 'Eligible',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Summary');

    const fileName = `Attendance_Report_${summaryClassId}_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // =========================================================================
  // 🎓 DEDICATED STUDENT VIEW (Restricted to own data)
  // =========================================================================
  if (isStudent) {
    const studentAdmissionNumber = user?.admissionNumber;
    const currentStudent = students.find(
      (s) =>
        s.admissionNumber === studentAdmissionNumber ||
        s.id === user?.studentId ||
        s.id === user?.id
    );

    if (!currentStudent) {
      return (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-800">Student Profile Not Linked</h2>
          <p className="text-xs text-slate-600 mt-1">
            Could not find attendance records for admission #{studentAdmissionNumber}.
          </p>
        </div>
      );
    }

    const studentClassSubjects = subjects.filter(
      (s) =>
        s.classId === currentStudent.classId &&
        s.trackAttendance !== false &&
        (!s.isSplitSubject || s.enrolledStudentIds?.includes(currentStudent.id))
    );

    const overallStats = calculateStudentSubjectAttendance(
      currentStudent.id,
      'ALL',
      attendanceRecords,
      clearances,
      rules
    );

    return (
      <div id="student-attendance-view" className="space-y-6 pb-12">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {currentStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">{currentStudent.name}</h1>
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  Adm #{currentStudent.admissionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Class:{' '}
                <strong className="text-slate-800">
                  {classes.find((c) => c.id === currentStudent.classId)?.name || 'Class'}
                </strong>{' '}
                • Semester Academic Attendance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-600">Overall Attendance (Without Medical)</div>
              <div
                className={`text-2xl font-bold ${
                  overallStats.isShortage ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {overallStats.overallPercentWithoutMedical}%
              </div>
              <div className="text-[11px] text-slate-600">
                Required minimum: {rules.minRequiredAttendancePercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Subject wise stats for student */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-sm text-slate-800">
            Subject-wise Attendance Status
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-3">Total Sessions</th>
                  <th className="py-3 px-3">Present</th>
                  <th className="py-3 px-3">Academic Leave</th>
                  <th className="py-3 px-3">Casual Leave</th>
                  <th className="py-3 px-3">Medical Leave</th>
                  <th className="py-3 px-3">Attendance %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentClassSubjects.map((sub) => {
                  const stats = calculateStudentSubjectAttendance(
                    currentStudent.id,
                    sub.id,
                    attendanceRecords,
                    clearances,
                    rules
                  );

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{sub.name}</div>
                        <div className="text-[11px] font-mono text-slate-600">{sub.code}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{stats.totalPeriods}</td>
                      <td className="py-3 px-3 text-emerald-700 font-bold">{stats.presentCount}</td>
                      <td className="py-3 px-3 text-purple-700 font-medium">{stats.academicLeaveCount}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{stats.casualLeaveCount}</td>
                      <td className="py-3 px-3 text-amber-700 font-medium">{stats.medicalLeaveCount}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold text-sm ${
                            stats.isShortage ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {stats.overallPercentWithoutMedical}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {stats.isCleared ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Cleared
                          </span>
                        ) : stats.isShortage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5" /> Shortage
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 👨‍🏫 TEACHER & STAFF ATTENDANCE WORKSPACE
  // =========================================================================
  return (
    <div id="attendance-hajar-view" className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Attendance Management (Hajar)
              </h1>
              <p className="text-xs text-slate-600">
                Fast subject-based marking with present-only toggle, automated casual leaves, and clearance.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          <button
            id="tab-mark-attendance"
            type="button"
            onClick={() => setActiveTab('mark')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'mark'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mark Attendance
          </button>

          <button
            id="tab-attendance-summary"
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'summary'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Summary & Reports
          </button>

          <button
            id="tab-attendance-clearance"
            type="button"
            onClick={() => setActiveTab('clearance')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'clearance'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Attendance Clearance</span>
          </button>

          <button
            id="tab-split-subjects"
            type="button"
            onClick={() => setActiveTab('split-subjects')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'split-subjects'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Split Electives
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: TEACHER-CENTRIC MARK ATTENDANCE
          - Shows that day's assigned subjects only (no need to select class)
          - Toggle "Show All" to see all assigned subjects across all days
          - Select subject -> Shows all students of that subject
          - Checkbox to tick Present (only), default unchecked is Casual Leave
          - Submit option
          - Summary statistics: Total classes, enrolled, session rates
      ========================================================================= */}
      {activeTab === 'mark' && (
        <div className="space-y-5">
          {/* Controls Bar: Teacher Switcher (for admin), Date Picker, and "Show All" Checkbox */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* For Super Admin: Teacher Selector */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Viewing as Teacher
                  </label>
                  <select
                    id="select-teacher-view"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="text-sm font-semibold py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.specialRoleTitle ? `(${t.specialRoleTitle})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Attendance Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="input-attendance-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-sm font-medium py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {currentDayOfWeek}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkbox: Show All Assigned Subjects (Includes other days & unscheduled) */}
            <div className="self-start md:self-center">
              <label
                id="toggle-show-all-teacher-subjects"
                className={`flex items-center gap-2.5 cursor-pointer px-3.5 py-2 rounded-xl border transition-all text-xs font-semibold ${
                  showAllSubjects
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={showAllSubjects}
                  onChange={(e) => setShowAllSubjects(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Show All Assigned Subjects (Other days & unscheduled)</span>
              </label>
            </div>
          </div>

          {/* Subjects Selection Cards */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>
                  {!showAllSubjects
                    ? `Today's Assigned Subjects (${currentDayOfWeek})`
                    : `All Assigned Subjects (${currentTeacherObj?.name || 'Teacher'})`}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {!showAllSubjects
                  ? 'Click a scheduled period below to mark attendance'
                  : 'Click any assigned subject and period to mark attendance'}
              </span>
            </div>

            {/* MODE 1: Today's Assigned Subjects Only (Timetable Slots) */}
            {!showAllSubjects ? (
              teacherTodayScheduledSlots.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    No periods scheduled for {currentTeacherObj?.name || 'you'} on {currentDayOfWeek} in the timetable.
                  </div>
                  <div className="text-[11px] text-slate-500">
                    You can tick the{' '}
                    <button
                      type="button"
                      onClick={() => setShowAllSubjects(true)}
                      className="text-emerald-700 font-bold underline hover:text-emerald-800"
                    >
                      "Show All Assigned Subjects"
                    </button>{' '}
                    checkbox above to mark any of your subjects manually.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {teacherTodayScheduledSlots.map((slot) => {
                    const sub = subjects.find((s) => s.id === slot.subjectId);
                    const cls = classes.find((c) => c.id === slot.classId);
                    const periodDef = periods.find((p) => p.periodNumber === slot.periodNumber);
                    const isSelected =
                      selectedSubjectId === slot.subjectId && selectedPeriod === slot.periodNumber;

                    // Check if already marked today
                    const existingRecords = attendanceRecords.filter(
                      (r) =>
                        r.date === selectedDate &&
                        r.classId === slot.classId &&
                        r.subjectId === slot.subjectId &&
                        r.period === slot.periodNumber
                    );
                    const isMarked = existingRecords.length > 0;
                    const presentCount = existingRecords.filter(
                      (r) => r.status === 'present' || r.status === 'academic_leave'
                    ).length;
                    const casualCount = existingRecords.length - presentCount;

                    return (
                      <button
                        key={`${slot.id}-${slot.periodNumber}`}
                        type="button"
                        onClick={() => {
                          setSelectedSubjectId(slot.subjectId);
                          setSelectedPeriod(slot.periodNumber);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600/30'
                            : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm leading-tight line-clamp-1">
                              {sub?.name || 'Subject'}
                            </div>
                            <div
                              className={`text-xs font-semibold mt-0.5 ${
                                isSelected ? 'text-emerald-100' : 'text-slate-600'
                              }`}
                            >
                              {cls?.name || 'Class'}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
                              isSelected
                                ? 'bg-emerald-800 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            P{slot.periodNumber}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-medium pt-1 border-t border-current/10">
                          <span
                            className={isSelected ? 'text-emerald-100' : 'text-slate-500 font-mono'}
                          >
                            {periodDef?.startTime || '07:45'} - {periodDef?.endTime || '08:30'}
                            {slot.isSplitSlot && ' • [Split]'}
                          </span>

                          {isMarked ? (
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-emerald-900/60 text-emerald-200'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Marked ({presentCount}P / {casualCount}CL)
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-amber-800/40 text-amber-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              ○ Pending
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              /* MODE 2: All Assigned Subjects Mode (Across All Days & Periods) */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teacherAllAssignedSubjects.map((sub) => {
                    const cls = classes.find((c) => c.id === sub.classId);
                    const isSelected = selectedSubjectId === sub.id;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubjectId(sub.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <div className="font-bold text-sm text-slate-800">{sub.name}</div>
                            <div className="text-xs font-semibold text-emerald-700">
                              {cls?.name || 'Class'} • {sub.code}
                            </div>
                          </div>
                          {sub.isSplitSubject && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                              Split Elective
                            </span>
                          )}
                        </div>

                        {/* Quick Period Selector for this subject */}
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-slate-500">Period:</span>
                          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => {
                              const isPSelected = isSelected && selectedPeriod === p;
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSubjectId(sub.id);
                                    setSelectedPeriod(p);
                                  }}
                                  className={`w-6 h-6 rounded text-[11px] font-bold transition-all ${
                                    isPSelected
                                      ? 'bg-emerald-700 text-white'
                                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  P{p}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE SUBJECT WORKSPACE: SHORT SUMMARY STATISTICS & STUDENT LIST */}
          {currentSubject && currentClass ? (
            <div className="space-y-4">
              {/* Short Summary Statistics Bar (As requested: "when taking each subject show the short summary statistics, like total classes.....") */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                        Period {selectedPeriod}
                      </span>
                      <h2 className="text-lg font-bold text-slate-800">{currentSubject.name}</h2>
                      <span className="text-xs font-semibold text-slate-500">
                        ({currentClass.name})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Session: {selectedDate} ({currentDayOfWeek}) • Period {selectedPeriod}
                      {currentSubject.isSplitSubject && ` • [Split: ${currentSubject.splitGroupName || 'Elective'}]`}
                    </div>
                  </div>

                  {/* Submission Status & Quick Feedback Toast */}
                  <div className="flex items-center gap-3">
                    {submitFeedback && (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-fade-in">
                        ✓ {submitFeedback}
                      </span>
                    )}

                    {isSessionAlreadySaved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Saved in Database
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Unsaved / New Session
                      </span>
                    )}

                    {/* Submit Button (Top) */}
                    <button
                      id="btn-submit-attendance-top"
                      type="button"
                      onClick={handleSubmitAttendance}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Submit Attendance</span>
                    </button>
                  </div>
                </div>

                {/* Summary Statistics Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Total Classes
                    </div>
                    <div className="text-xl font-bold text-slate-800">
                      {subjectSummaryStats.totalClassesHeld}
                    </div>
                    <div className="text-[10px] text-slate-500">Conducted sessions</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Enrolled
                    </div>
                    <div className="text-xl font-bold text-slate-800">
                      {subjectSummaryStats.totalEnrolled}
                    </div>
                    <div className="text-[10px] text-slate-500">Active students</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                      Present (Now)
                    </div>
                    <div className="text-xl font-bold text-emerald-700">
                      {subjectSummaryStats.presentThisSession}
                    </div>
                    <div className="text-[10px] text-emerald-700">Checked present</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300">
                    <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                      Casual Leave
                    </div>
                    <div className="text-xl font-bold text-slate-700">
                      {subjectSummaryStats.casualLeaveThisSession}
                    </div>
                    <div className="text-[10px] text-slate-600">Default unchecked</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Session Rate
                    </div>
                    <div className="text-xl font-bold text-emerald-700">
                      {subjectSummaryStats.sessionRate}%
                    </div>
                    <div className="text-[10px] text-slate-500">Attendance this period</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Overall Rate
                    </div>
                    <div className="text-xl font-bold text-slate-800">
                      {subjectSummaryStats.historicalRate}%
                    </div>
                    <div className="text-[10px] text-slate-500">Subject average</div>
                  </div>
                </div>
              </div>

              {/* STUDENT LIST & CHECKBOX TO TICK PRESENT (ONLY) */}
              {/* Default unchecked option is Casual Leave */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* List Action Toolbar */}
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student or admission #..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 w-56 font-medium"
                      />
                    </div>
                    <span className="text-xs text-slate-500 hidden md:inline">
                      Showing {displayedStudents.length} students
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-all"
                    >
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={handleUncheckAll}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200/80 text-slate-700 hover:bg-slate-300 border border-slate-300 transition-all"
                    >
                      Uncheck All (All Casual Leave)
                    </button>
                  </div>
                </div>

                {/* Information banner on unchecked rule */}
                <div className="px-4 py-2 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <strong>Rule:</strong> Checkbox ticks <strong>Present (only)</strong>. Unchecked students default automatically to <strong>Casual Leave</strong> upon submitting.
                  </span>
                  <span className="font-semibold text-slate-600 hidden sm:inline">
                    {subjectSummaryStats.presentThisSession} Present • {subjectSummaryStats.casualLeaveThisSession} Casual Leave
                  </span>
                </div>

                {/* Table of students */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-600 font-semibold">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Current Status</th>
                        <th className="py-3 px-4 text-right">Tick Present (Only)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedStudents.map((student, idx) => {
                        const isPresent = presentMap[student.id] ?? false;

                        return (
                          <tr
                            key={student.id}
                            onClick={() => handleToggleStudentPresent(student.id)}
                            className={`cursor-pointer transition-colors ${
                              isPresent
                                ? 'hover:bg-emerald-50/30'
                                : 'bg-slate-50/60 hover:bg-slate-100/70'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-mono text-slate-500 text-center">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                    isPresent
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-sm">
                                    {student.name}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-500">
                                    Adm #{student.admissionNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              {isPresent ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Present
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                                  Casual Leave (Default)
                                </span>
                              )}
                            </td>
                            <td
                              className="py-3.5 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <label
                                className={`inline-flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl border transition-all select-none ${
                                  isPresent
                                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isPresent}
                                  onChange={() => handleToggleStudentPresent(student.id)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className="text-xs font-bold">Present</span>
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Submit Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    Marking for <strong>{currentSubject.name}</strong> • Period {selectedPeriod} •{' '}
                    <strong>{subjectSummaryStats.presentThisSession} Present</strong>,{' '}
                    <strong>{subjectSummaryStats.casualLeaveThisSession} Casual Leave</strong>
                  </div>

                  <button
                    id="btn-submit-attendance-bottom"
                    type="button"
                    onClick={handleSubmitAttendance}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      Submit Attendance ({subjectSummaryStats.presentThisSession} Present •{' '}
                      {subjectSummaryStats.casualLeaveThisSession} Casual Leave)
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Subject Selected</div>
              <div className="text-xs text-slate-500">
                Please select an assigned subject above to mark attendance.
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ATTENDANCE SUMMARY & REPORTS (EXCEL & PRINT)
      ========================================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Class</label>
                <select
                  value={summaryClassId}
                  onChange={(e) => setSummaryClassId(e.target.value)}
                  className="text-sm font-semibold py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Subject</label>
                <select
                  value={summarySubjectId}
                  onChange={(e) => setSummarySubjectId(e.target.value)}
                  className="text-sm font-semibold py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                >
                  <option value="ALL">All Subjects (Combined)</option>
                  {subjects
                    .filter((s) => s.classId === summaryClassId && s.status !== 'inactive')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Student attendance summary breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-semibold">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-3">Total Sessions</th>
                    <th className="py-3 px-3">Present</th>
                    <th className="py-3 px-3">Academic Leave</th>
                    <th className="py-3 px-3">Official Leave</th>
                    <th className="py-3 px-3">Casual Leave</th>
                    <th className="py-3 px-3">Medical Leave</th>
                    <th className="py-3 px-3">Attendance %</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter((s) => s.classId === summaryClassId && s.status === 'active')
                    .map((student, idx) => {
                      const stats = calculateStudentSubjectAttendance(
                        student.id,
                        summarySubjectId,
                        attendanceRecords,
                        clearances,
                        rules
                      );

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{student.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">
                              Adm #{student.admissionNumber}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{stats.totalPeriods}</td>
                          <td className="py-3 px-3 text-emerald-700 font-bold">{stats.presentCount}</td>
                          <td className="py-3 px-3 text-purple-700 font-medium">{stats.academicLeaveCount}</td>
                          <td className="py-3 px-3 text-blue-700 font-medium">{stats.officialLeaveCount}</td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{stats.casualLeaveCount}</td>
                          <td className="py-3 px-3 text-amber-700 font-medium">{stats.medicalLeaveCount}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-bold text-sm ${
                                stats.isShortage ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {stats.overallPercentWithoutMedical}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {stats.isCleared ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5" /> Cleared
                              </span>
                            ) : stats.isShortage ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5" /> Shortage
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Eligible
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ATTENDANCE CLEARANCE & CONDONATION (RESTRICTED TO SPECIFIC USERS: ACADEMIC ASSISTANT, HOD, PRINCIPAL, SUPER ADMIN)
          - In attendance clearance option: shows Academic leave, Official leave, Medical leave
          - Allows converting casual leaves or granting condonation
      ========================================================================= */}
      {activeTab === 'clearance' && (
        <div className="space-y-5">
          {!canGrantClearance ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <Lock className="w-10 h-10 text-amber-500 mx-auto" />
              <h2 className="text-base font-bold text-slate-800">
                Restricted Clearance Access
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Attendance clearance, condonation, and leave conversions (Academic, Official, Medical) are restricted to authorized institutional authorities: <strong>Academic Assistant, HoD, HoS, Principal, and Super Admin</strong>.
              </p>
              <div className="text-[11px] text-slate-500">
                Current role: <strong>{currentTeacherObj?.specialRoleTitle || user?.role || 'Teacher'}</strong>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Clearance Header & Authorized Personnel Badge */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">
                      Attendance Clearance & Leave Conversion Portal
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      Authorized: {currentTeacherObj?.specialRoleTitle || user?.role || 'HoD / Academic Assistant'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Convert student leaves to <strong>Academic Leave</strong> (counted as Present), <strong>Official Leave</strong>, or <strong>Medical Leave</strong>, and grant attendance condonation clearances.
                  </p>
                </div>

                <button
                  id="btn-grant-clearance"
                  type="button"
                  onClick={() => {
                    setClearanceTargetStudentId(students[0]?.id || '');
                    setIsClearanceModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>+ Grant % Condonation</span>
                </button>
              </div>

              {/* Clearance Leave Categories Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-2">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <span>Academic Leave</span>
                  </div>
                  <p className="text-xs text-purple-800">
                    Counted as <strong>100% Present</strong>. Approved for students representing the institution in conferences, academic competitions, seminars, and authorized examinations.
                  </p>
                </div>

                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                    <Award className="w-4 h-4 text-blue-700" />
                    <span>Official Leave</span>
                  </div>
                  <p className="text-xs text-blue-800">
                    Permitted for institutional sports and student council events. Counted within allowable 10% threshold.
                  </p>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <HeartPulse className="w-4 h-4 text-amber-700" />
                    <span>Medical Leave</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    Hospitalization or medical leave supported by a doctor's certificate. <strong>Excluded from the attendance denominator</strong>.
                  </p>
                </div>
              </div>

              {/* Student Leave Records & Conversion Actions */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-700" />
                    <span>Recorded Student Leaves (Available for HoD / Academic Assistant Conversion)</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Convert casual leaves or absences into Academic, Official, or Medical leaves
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-semibold">
                        <th className="py-3 px-4">Date & Period</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Class & Subject</th>
                        <th className="py-3 px-4">Current Status</th>
                        <th className="py-3 px-4 text-right">Convert Leave (Authority Action)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceRecords
                        .filter(
                          (r) =>
                            r.status === 'casual_leave' ||
                            r.status === 'absent' ||
                            r.status === 'medical_leave' ||
                            r.status === 'official_leave' ||
                            r.status === 'academic_leave'
                        )
                        .slice(0, 50)
                        .map((rec) => {
                          const std = students.find((s) => s.id === rec.studentId);
                          const cls = classes.find((c) => c.id === rec.classId);
                          const sub = subjects.find((s) => s.id === rec.subjectId);

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/60">
                              <td className="py-3 px-4 font-mono text-slate-600">
                                {rec.date} • P{rec.period}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-800">{std?.name || 'Student'}</div>
                                <div className="text-[11px] font-mono text-slate-500">
                                  Adm #{std?.admissionNumber}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-700">{sub?.name}</div>
                                <div className="text-[11px] text-slate-500">{cls?.name}</div>
                              </td>
                              <td className="py-3 px-4">
                                {rec.status === 'academic_leave' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
                                    <Sparkles className="w-3 h-3" /> Academic Leave (Present)
                                  </span>
                                )}
                                {rec.status === 'official_leave' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                                    Official Leave
                                  </span>
                                )}
                                {rec.status === 'medical_leave' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                                    Medical Leave
                                  </span>
                                )}
                                {rec.status === 'casual_leave' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                                    Casual Leave
                                  </span>
                                )}
                                {rec.status === 'absent' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                                    Absent
                                  </span>
                                )}
                                {rec.remarks && (
                                  <div className="text-[10px] text-slate-500 italic mt-0.5">
                                    {rec.remarks}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConversionTargetRecord(rec);
                                      setConversionTargetStatus('academic_leave');
                                      setIsConversionModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 transition-all"
                                  >
                                    + Academic
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConversionTargetRecord(rec);
                                      setConversionTargetStatus('official_leave');
                                      setIsConversionModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-all"
                                  >
                                    + Official
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConversionTargetRecord(rec);
                                      setConversionTargetStatus('medical_leave');
                                      setIsConversionModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all"
                                  >
                                    + Medical
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Condonation Clearances Registry */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center justify-between">
                  <span>Issued Attendance Clearances (Condonations)</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {clearances.length} Active clearances
                  </span>
                </div>

                {clearances.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No attendance condonation clearances issued yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {clearances.map((c) => {
                      const student = students.find((s) => s.id === c.studentId);
                      const sub = subjects.find((s) => s.id === c.subjectId);

                      return (
                        <div
                          key={c.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">
                                {student?.name || 'Student'}
                              </span>
                              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                Adm #{student?.admissionNumber}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Approved: {c.approvedPercentage || 85}%
                              </span>
                            </div>
                            <div className="text-xs text-slate-600">
                              Subject: <strong>{sub ? sub.name : 'All Subjects (Institutional)'}</strong> •
                              Approved by: <strong>{c.grantedByName || c.clearedByName || 'Authority'}</strong> ({c.grantedByRole || c.clearedByRole || 'Official'})
                            </div>
                            <div className="text-xs text-slate-700 italic">"{c.reason}"</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => dataService.revokeAttendanceClearance(c.id)}
                            className="px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-all self-start sm:self-center"
                          >
                            Revoke Clearance
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: SPLIT ELECTIVES MANAGEMENT
      ========================================================================= */}
      {activeTab === 'split-subjects' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-800 mb-1">
              Split Elective Subject Management
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Manage periods where classes split into electives (e.g. Computer Application vs Humanities).
              Enrolled students are tracked exclusively, preventing false absences.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects
                .filter((s) => s.status !== 'inactive')
                .map((sub) => {
                  const enrolledIds = sub.enrolledStudentIds || [];
                  const cls = classes.find((c) => c.id === sub.classId);

                  return (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        sub.isSplitSubject
                          ? 'bg-purple-50/50 border-purple-200'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{sub.name}</span>
                          <span className="text-xs font-mono text-slate-600">({sub.code})</span>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            sub.isSplitSubject
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {sub.isSplitSubject ? 'Split Elective' : 'Standard Subject'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <div>
                          Class: <strong>{cls?.name}</strong>
                        </div>
                        <div>
                          Assigned Teacher:{' '}
                          <strong>
                            {teachers.find((t) => t.id === sub.assignedTeacherId)?.name || 'Unassigned'}
                          </strong>
                        </div>
                        <div>
                          Enrolled Students:{' '}
                          <strong className="text-slate-800">
                            {sub.isSplitSubject ? enrolledIds.length : 'All Class Students'}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const classAllStudents = students.filter(
                              (s) => s.classId === sub.classId && s.status === 'active'
                            );
                            dataService.updateSubjectAttendanceSettings(sub.id, {
                              isSplitSubject: !sub.isSplitSubject,
                              splitGroupName: !sub.isSplitSubject ? sub.name : undefined,
                              enrolledStudentIds: !sub.isSplitSubject
                                ? classAllStudents.slice(0, Math.ceil(classAllStudents.length / 2)).map((s) => s.id)
                                : undefined,
                            });
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            sub.isSplitSubject
                              ? 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                              : 'bg-purple-700 text-white hover:bg-purple-800'
                          }`}
                        >
                          {sub.isSplitSubject ? 'Convert to Standard' : 'Enable Split Elective'}
                        </button>

                        {sub.isSplitSubject && (
                          <button
                            type="button"
                            onClick={() => {
                              setEnrollmentSubjectId(sub.id);
                              setTempEnrolledStudentIds(sub.enrolledStudentIds || []);
                              setIsEnrollmentModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-lg transition-all"
                          >
                            Manage Enrolled Students
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: GRANT CONDONATION CLEARANCE
      ========================================================================= */}
      {isClearanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>Grant Attendance Clearance</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsClearanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClearance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student
                </label>
                <select
                  value={clearanceTargetStudentId}
                  onChange={(e) => setClearanceTargetStudentId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  required
                >
                  {students
                    .filter((s) => s.status === 'active')
                    .map((std) => (
                      <option key={std.id} value={std.id}>
                        {std.name} (Adm #{std.admissionNumber})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicable Subject
                </label>
                <select
                  value={clearanceTargetSubjectId}
                  onChange={(e) => setClearanceTargetSubjectId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                >
                  <option value="ALL">All Subjects (Institutional Overall Clearance)</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approved Condoned Percentage (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={clearanceApprovedPercentage}
                  onChange={(e) => setClearanceApprovedPercentage(Number(e.target.value))}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  required
                />
                <span className="text-[10px] text-slate-500">
                  Default condonation threshold is 85%.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason & Official Authority Remarks
                </label>
                <textarea
                  value={clearanceRemarks}
                  onChange={(e) => setClearanceRemarks(e.target.value)}
                  placeholder="e.g., Condonation approved on recommendation of HoD & Academic Council due to documented sports representation."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 h-20"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClearanceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
                >
                  Issue Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LEAVE CONVERSION (HOD / ACADEMIC ASSISTANT TO ACADEMIC, OFFICIAL, MEDICAL LEAVE)
      ========================================================================= */}
      {isConversionModalOpen && conversionTargetRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-700" />
                <span>Authority Leave Conversion</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsConversionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1">
              <div>
                Student:{' '}
                <strong>
                  {students.find((s) => s.id === conversionTargetRecord.studentId)?.name}
                </strong>
              </div>
              <div>
                Date & Period:{' '}
                <strong>
                  {conversionTargetRecord.date} • Period {conversionTargetRecord.period}
                </strong>
              </div>
              <div>
                Current Status:{' '}
                <span className="capitalize font-bold text-slate-700">
                  {conversionTargetRecord.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveConversion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Convert to Leave Category
                </label>
                <select
                  value={conversionTargetStatus}
                  onChange={(e) =>
                    setConversionTargetStatus(
                      e.target.value as 'academic_leave' | 'official_leave' | 'medical_leave'
                    )
                  }
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                >
                  <option value="academic_leave">
                    Academic Leave (Counted as 100% Present)
                  </option>
                  <option value="official_leave">
                    Official Leave (Institutional Representation - max 10%)
                  </option>
                  <option value="medical_leave">
                    Medical Leave (Excluded from attendance denominator)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason & Reference Documentation
                </label>
                <textarea
                  value={conversionReason}
                  onChange={(e) => setConversionReason(e.target.value)}
                  placeholder="e.g., Participated in State Inter-University Debate Championship / Medical certificate #8843 submitted."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 h-20"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConversionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs"
                >
                  Confirm Conversion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SPLIT ELECTIVES STUDENT ENROLLMENT
      ========================================================================= */}
      {isEnrollmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Split className="w-5 h-5 text-purple-700" />
                <span>Manage Split Elective Enrollment</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEnrollmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Select students enrolled in this elective subject. Students not selected will not be marked absent during this period.
            </div>

            <form onSubmit={handleSaveEnrollment} className="flex-1 flex flex-col min-h-0 space-y-3">
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
                {students
                  .filter(
                    (s) =>
                      s.classId ===
                        subjects.find((sub) => sub.id === enrollmentSubjectId)?.classId &&
                      s.status === 'active'
                  )
                  .map((student) => {
                    const isEnrolled = tempEnrolledStudentIds.includes(student.id);

                    return (
                      <label
                        key={student.id}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer rounded-lg select-none"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isEnrolled}
                            onChange={() => {
                              if (isEnrolled) {
                                setTempEnrolledStudentIds(
                                  tempEnrolledStudentIds.filter((id) => id !== student.id)
                                );
                              } else {
                                setTempEnrolledStudentIds([...tempEnrolledStudentIds, student.id]);
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-xs text-slate-800">{student.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              Adm #{student.admissionNumber}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isEnrolled
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                        </span>
                      </label>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  {tempEnrolledStudentIds.length} students selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEnrollmentModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs"
                  >
                    Save Enrollment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
