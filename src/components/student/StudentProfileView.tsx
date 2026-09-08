import React, { useState } from 'react';
import { dataService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  School,
  Calendar,
  ShieldCheck,
  Mail,
  Phone,
  Hash,
  Award,
  Heart,
  BookOpen,
  Clock,
  AlertTriangle,
  FileText,
  Printer,
  CheckCircle2,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { AcademicPerformanceDossier } from './AcademicPerformanceDossier';

export const StudentProfileView: React.FC = () => {
  const { currentUser } = useAuth();
  const state = dataService.getState();
  const [activeTab, setActiveTab] = useState<'overview' | 'guardian' | 'academic' | 'achievements' | 'attendance' | 'discipline' | 'notes'>('overview');

  const student = state.students.find(
    (s) =>
      s.username === currentUser?.username ||
      s.admissionNumber === currentUser?.admissionNumber ||
      s.id === currentUser?.id ||
      `user-${s.id}` === currentUser?.id
  );

  const studentClass = student ? state.classes.find((c) => c.id === student.classId) : null;
  const classTeacher = studentClass
    ? state.teachers.find((t) => t.id === studentClass.classTeacherId)
    : null;

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        No student profile linked with this login credential.
      </div>
    );
  }

  // Related collections
  const achievements = (state.achievements || []).filter((a) => a.studentId === student.id);
  const behavior = (state.behaviorRecords || []).filter((b) => b.studentId === student.id);
  const leaves = (state.leaveApplications || []).filter((l) => l.studentId === student.id);
  const attendance = (state.attendanceRecords || []).filter((a) => a.studentId === student.id);
  const studentMarks = (state.marks || []).filter((m) => m.studentId === student.id);
  const classSubjects = state.subjects.filter((s) => s.classId === student.classId);

  // Attendance metrics
  const totalAttPeriods = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'academic_leave').length;
  const attPercent = totalAttPeriods > 0 ? Math.round((presentCount / totalAttPeriods) * 100) : 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-indigo-600" />
            Official Student Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Institutional academic dossier, attendance trajectory, and extra-curricular portfolio
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="self-start sm:self-auto px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Official Dossier
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-5">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 dark:border-indigo-900 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-indigo-600/20">
                {student.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {student.name}
                </h2>
                <Badge variant={student.status === 'active' ? 'success' : 'neutral'}>
                  {student.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  Admission No: {student.admissionNumber}
                </span>
                {student.rollNumber && (
                  <span>Roll No: <span className="font-semibold text-slate-700 dark:text-slate-200">{student.rollNumber}</span></span>
                )}
                <span>•</span>
                <span>{studentClass?.name || 'Class Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="flex sm:justify-end gap-6 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attendance Rate</span>
              <span className={`text-xl font-black ${attPercent >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {attPercent}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">85% requirement</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-6">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Class Teacher</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-1">
                {classTeacher?.name || 'Assigned Soon'}
              </span>
              <span className="text-[10px] text-slate-400 block">{studentClass?.academicYear}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            General & Contact
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'guardian'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Family & Guardian
          </button>
          <button
            onClick={() => setActiveTab('academic')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'academic'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Academic Dossier
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'achievements'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Honors & Achievements ({achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Attendance & Leaves
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            Teacher Remarks
          </button>
        </div>

        {/* Tab 1: Overview & Contact */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                Official Enrollment Details
              </h3>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-slate-400" /> Admission Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{student.admissionNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 flex items-center gap-1.5"><School className="w-3.5 h-3.5 text-slate-400" /> Class & Section</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{studentClass?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Birth</span>
                <span className="font-medium text-slate-900 dark:text-white">{student.dob || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500" /> Blood Group</span>
                <span className="font-bold text-slate-900 dark:text-white">{student.bloodGroup || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Gender</span>
                <span className="font-semibold capitalize text-slate-900 dark:text-white">{student.gender || 'Not specified'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                Student Contact & Address
              </h3>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Phone</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{student.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> Email</span>
                <span className="font-medium text-slate-900 dark:text-white">{student.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Portal Login</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{student.admissionNumber}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Residential Address</span>
                <span className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {student.address || 'No residential address recorded.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Guardian Info */}
        {activeTab === 'guardian' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                Primary Guardian Details
              </h3>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Guardian Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{student.guardian?.name || 'Not provided'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Relationship</span>
                <span className="font-medium text-slate-900 dark:text-white">{student.guardian?.relationship || 'Parent'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Occupation</span>
                <span className="font-medium text-slate-900 dark:text-white">{student.guardian?.occupation || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Contact Number</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{student.guardian?.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                Family & Emergency Reach
              </h3>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Father's Name</span>
                <span className="font-medium text-slate-900 dark:text-white">{student.guardian?.fatherName || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Mother's Name</span>
                <span className="font-medium text-slate-900 dark:text-white">{student.guardian?.motherName || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Emergency Alternate Phone</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{student.guardian?.alternatePhone || 'N/A'}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Guardian Address</span>
                <span className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {student.guardian?.address || student.address || 'Same as residential address.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Academic Performance */}
        {activeTab === 'academic' && (
          <div className="pt-6">
            <AcademicPerformanceDossier studentId={student.id} />
          </div>
        )}

        {/* Tab 4: Achievements */}
        {activeTab === 'achievements' && (
          <div className="space-y-4 pt-6 text-xs">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px]">
              Honors, Competitions & Certificates
            </h3>
            {achievements.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
                No extra-curricular achievements recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="warning">{ach.category.toUpperCase()}</Badge>
                      <span className="text-[11px] text-slate-400">{ach.date}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ach.title}</h4>
                    {ach.positionPrize && (
                      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {ach.positionPrize}
                      </div>
                    )}
                    {ach.awardedBy && (
                      <div className="text-slate-500">
                        Awarded by: <span className="font-medium text-slate-800 dark:text-slate-200">{ach.awardedBy}</span>
                      </div>
                    )}
                    {ach.description && <p className="text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">{ach.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Attendance & Leaves */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 pt-6 text-xs">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px]">
              Attendance Record & Leave Applications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Overall Rate</span>
                <div className={`text-xl font-black mt-1 ${attPercent >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>{attPercent}%</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Periods Present</span>
                <div className="text-xl font-black text-indigo-600 mt-1">{presentCount} / {totalAttPeriods}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Approved Leaves</span>
                <div className="text-xl font-black text-amber-600 mt-1">{leaves.filter((l) => l.status === 'approved' || l.status === 'arrived').length}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Return Check-ins</span>
                <div className="text-xl font-black text-emerald-600 mt-1">{leaves.filter((l) => l.hasArrived).length}</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">My Leave Applications</h4>
              {leaves.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                  No leave applications filed.
                </div>
              ) : (
                leaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={l.status === 'approved' || l.status === 'arrived' ? 'success' : l.status === 'rejected' ? 'danger' : 'warning'}>
                          {l.status.toUpperCase()}
                        </Badge>
                        <span className="font-semibold capitalize text-slate-900 dark:text-white">
                          {l.leaveType.replace('_', ' ')} Leave ({l.totalDurationFormatted || `${l.totalDurationMinutes}m`})
                        </span>
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {l.startDate} {l.endDate !== l.startDate ? `to ${l.endDate}` : ''} • Reason: {l.reason}
                      </div>
                    </div>
                    {l.hasArrived && (
                      <div className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Returned
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Class Teacher Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4 pt-6 text-xs">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Class Teacher Observations & Feedback
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[10px]">
                  Observed Strengths
                </span>
                <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                  {student.classTeacherNotes?.strengths || 'Consistent participation in classroom discussions and coursework.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px]">
                  Focus Areas For Growth
                </span>
                <p className="text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  {student.classTeacherNotes?.areasOfImprovement || 'Focus on time management during major evaluations.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                General Behavioral Conduct
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {student.classTeacherNotes?.behaviorRemarks || 'Demonstrates exemplary conduct and respect towards faculty and classmates.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-[10px]">
                Teacher Recommendations
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {student.classTeacherNotes?.recommendations || 'Recommended to pursue academic competitions and collegiate symposiums.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1">
              <span className="font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                Counseling & Mentorship Notes
              </span>
              <p className="text-purple-900 dark:text-purple-200 leading-relaxed font-medium">
                {student.classTeacherNotes?.counselingNotes || 'Regular advising sessions active. Student is responsive to mentoring guidance.'}
              </p>
            </div>

            {student.classTeacherNotes?.lastUpdated && (
              <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span>
                  Recorded by <strong>{student.classTeacherNotes.updatedByName || 'Faculty'}</strong>
                </span>
                <span>
                  Updated on {new Date(student.classTeacherNotes.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
