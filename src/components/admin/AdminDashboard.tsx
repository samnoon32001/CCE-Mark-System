import React, { useState } from 'react';
import { dataService } from '../../services/db';
import { DashboardShowcaseBanner } from '../showcase/DashboardShowcaseBanner';
import { Modal } from '../common/Modal';
import { ImageUploadField } from '../common/ImageUploadField';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  UserCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import type { NavSection } from '../layout/Sidebar';

export const AdminDashboard: React.FC<{ onNavigate: (section: NavSection) => void }> = ({
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const state = dataService.getState();

  const totalStudents = state.students.length;
  const activeStudents = state.students.filter((s) => s.status === 'active').length;
  const totalTeachers = state.teachers.length;
  const activeTeachers = state.teachers.filter((t) => t.status === 'active').length;
  const totalClasses = state.classes.length;
  const totalSubjects = state.subjects.length;
  const totalMarks = state.marks.length;

  const recentLogs = state.auditLogs.slice(0, 6);
  const recentStudents = state.students.slice(-5).reverse();

  // Quick Add Student Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [formAdmissionNumber, setFormAdmissionNumber] = useState('');
  const [formName, setFormName] = useState('');
  const [formClassId, setFormClassId] = useState(state.classes[0]?.id || '');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [quickAddSuccess, setQuickAddSuccess] = useState<string | null>(null);

  const handleOpenAddStudent = () => {
    setFormAdmissionNumber('');
    setFormName('');
    setFormClassId(state.classes[0]?.id || '');
    setFormPhone('');
    setFormEmail('');
    setFormPhoto('');
    setFormPassword('');
    setFormError(null);
    setIsAddStudentOpen(true);
  };

  const handleQuickAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanAdmission = formAdmissionNumber.trim();
    const cleanName = formName.trim();

    if (!cleanAdmission || !cleanName || !formClassId) {
      setFormError('Admission number, full name, and class are required.');
      return;
    }

    // Check unique admission number
    const duplicateAdmission = state.students.find(
      (s) => s.admissionNumber.toLowerCase() === cleanAdmission.toLowerCase()
    );
    if (duplicateAdmission) {
      setFormError(`Admission number "${cleanAdmission}" is already in use by ${duplicateAdmission.name}.`);
      return;
    }

    const actor = currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : undefined;

    dataService.addStudent(
      {
        admissionNumber: cleanAdmission,
        name: cleanName,
        classId: formClassId,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        photoUrl: formPhoto || undefined,
        username: cleanAdmission,
        status: 'active',
      },
      formPassword.trim() || 'student123',
      actor
    );

    setIsAddStudentOpen(false);
    setQuickAddSuccess(`Student "${cleanName}" (${cleanAdmission}) added successfully!`);
    setTimeout(() => setQuickAddSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Spotlight Toppers Banner (Ad style priority carousel) */}
      <DashboardShowcaseBanner />

      {/* Success Notification Toast for Quick Add */}
      {quickAddSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{quickAddSuccess}</span>
          </div>
          <button
            onClick={() => onNavigate('students')}
            className="text-xs underline font-bold hover:text-emerald-900 dark:hover:text-white"
          >
            View in Student Directory →
          </button>
        </div>
      )}

      {/* Quick Action Header Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            System Overview & Count Statistics
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="dashboard-quick-add-student-btn"
            onClick={handleOpenAddStudent}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
          <button
            id="dashboard-quick-import-excel-btn"
            onClick={() => onNavigate('excel-import')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Excel</span>
          </button>
        </div>
      </div>

      {/* 4 Coloured Count Cards (Old Model with vibrant colors) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Students Enrolment (Vibrant Blue/Indigo Card) */}
        <div
          id="stat-card-students"
          onClick={() => onNavigate('students')}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-blue-400/30 flex flex-col justify-between group"
        >
          {/* Subtle Watermark */}
          <Users className="absolute -right-3 -bottom-3 w-28 h-28 text-white/10 group-hover:scale-105 transition-transform pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Students Enrolment
            </span>
            <div className="p-2 bg-white/20 text-white rounded-xl backdrop-blur-xs shadow-inner">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {totalStudents}
              </span>
              <span className="text-xs text-blue-100 font-medium">
                Total Registered
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-white/20 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-xs"></span>
                {activeStudents} Active
              </span>
              <span className="text-blue-200/60">•</span>
              <span className="text-blue-100/90 font-medium">
                {totalStudents - activeStudents} Inactive
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Faculty & Teachers (Vibrant Purple/Violet Card) */}
        <div
          id="stat-card-teachers"
          onClick={() => onNavigate('teachers')}
          className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-600 to-fuchsia-700 text-white rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-purple-400/30 flex flex-col justify-between group"
        >
          {/* Subtle Watermark */}
          <GraduationCap className="absolute -right-3 -bottom-3 w-28 h-28 text-white/10 group-hover:scale-105 transition-transform pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-100">
              Faculty & Teachers
            </span>
            <div className="p-2 bg-white/20 text-white rounded-xl backdrop-blur-xs shadow-inner">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {totalTeachers}
              </span>
              <span className="text-xs text-purple-100 font-medium">
                Total Faculty
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-white/20 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-xs"></span>
                {activeTeachers} Active
              </span>
              <span className="text-purple-200/60">•</span>
              <span className="text-purple-100/90 font-medium">
                {totalTeachers - activeTeachers} Inactive
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Classes & Sections (Vibrant Amber/Orange Card) */}
        <div
          id="stat-card-classes"
          onClick={() => onNavigate('classes')}
          className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-amber-400/30 flex flex-col justify-between group"
        >
          {/* Subtle Watermark */}
          <School className="absolute -right-3 -bottom-3 w-28 h-28 text-white/10 group-hover:scale-105 transition-transform pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
              Classes & Sections
            </span>
            <div className="p-2 bg-white/20 text-white rounded-xl backdrop-blur-xs shadow-inner">
              <School className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {totalClasses}
              </span>
              <span className="text-xs text-amber-100 font-medium">
                Active Divisions
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-white/20 text-xs">
              <span className="font-bold text-white">
                AY {state.currentAcademicYear}
              </span>
              <span className="text-amber-200/60">•</span>
              <span className="text-amber-100/90 font-medium">
                {totalSubjects} Subjects
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Assessment Matrix (Vibrant Emerald/Teal Card) */}
        <div
          id="stat-card-assessments"
          onClick={() => onNavigate('evaluation-levels')}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-emerald-400/30 flex flex-col justify-between group"
        >
          {/* Subtle Watermark */}
          <BookOpen className="absolute -right-3 -bottom-3 w-28 h-28 text-white/10 group-hover:scale-105 transition-transform pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Assessment Matrix
            </span>
            <div className="p-2 bg-white/20 text-white rounded-xl backdrop-blur-xs shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="relative z-10 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {totalMarks}
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                Entries Logged
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-white/20 text-xs">
              <span className="font-bold text-white">
                {state.evaluationLevels.length} CCE Levels
              </span>
              <span className="text-emerald-200/60">•</span>
              <span className="text-emerald-100/90 font-medium">
                Factor 30 Standard
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Class Statistics & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes & Student Enrolment Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Class Enrolment & Teaching Assignments
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Active classes in academic year {state.currentAcademicYear}
              </p>
            </div>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
            >
              Manage Classes <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {state.classes.map((c) => {
              const studentsInClass = state.students.filter((s) => s.classId === c.id);
              const subjectsInClass = state.subjects.filter((s) => s.classId === c.id);
              const classTeacher = state.teachers.find((t) => t.id === c.classTeacherId);

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {c.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-800">
                        {c.academicYear}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Class Teacher:{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {classTeacher?.name || 'Not Assigned'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                        {studentsInClass.length}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                        {subjectsInClass.length}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Subjects</div>
                    </div>
                    <button
                      onClick={() => onNavigate('classes')}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                    >
                      View Class
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Highlights / Evaluation Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              CCE Evaluation System
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Continuous and Comprehensive Evaluation configured for school standards.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 border-l-4 border-l-indigo-500">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  30-Mark Subject Weightage
                </div>
                <div className="text-xs font-mono text-indigo-700 dark:text-indigo-400 mt-1 font-semibold">
                  Formula: (Total Obtained / Total Max) × 30
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Dynamic Evaluation Levels
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Supports unlimited CCE levels with custom maximum marks (e.g. 70, 100).
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Total Marks Recorded
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {totalMarks} entries
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('reports')}
              className="w-full py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-md transition text-center cursor-pointer"
            >
              Generate Full Institution Reports →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity & Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Activity */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent System Activity & Audit Trail
              </h3>
            </div>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              All Logs
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 truncate mt-0.5">
                    {log.details}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    By: {log.userName} ({log.role})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Added Students */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recently Enrolled Students
              </h3>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              View All Students
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentStudents.map((std) => {
              const classRoom = state.classes.find((c) => c.id === std.classId);
              return (
                <div key={std.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {std.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Ad.No: <span className="font-mono text-indigo-600 dark:text-indigo-400">{std.admissionNumber}</span> | Class: {classRoom?.name || 'Unassigned'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Add Student Modal */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Quick Student Admission"
        maxWidth="lg"
      >
        <form onSubmit={handleQuickAddStudent} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Student Photo Upload */}
          <ImageUploadField
            id="quick-add-student-photo"
            label="Student Photo (Optional)"
            value={formPhoto}
            onChange={setFormPhoto}
            helperText="Upload image file or paste web URL. Compresses automatically."
            aspectRatio="square"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admission Number *
              </label>
              <input
                type="text"
                value={formAdmissionNumber}
                onChange={(e) => setFormAdmissionNumber(e.target.value)}
                placeholder="e.g. ADM2026-042"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Class *
              </label>
              <select
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {state.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.academicYear})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Student Name *
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Bilal Ahmed"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parent / Student Phone (Optional)
              </label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Portal Initial Password (Optional)
            </label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Default: student123"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Username will automatically match Admission Number.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddStudentOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Complete Admission
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  accent: 'blue' | 'purple' | 'emerald' | 'indigo' | 'amber' | 'rose';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon, accent, onClick }) => {
  const borderAccent =
    accent === 'indigo' || accent === 'blue'
      ? 'border-l-4 border-l-indigo-500'
      : accent === 'amber'
      ? 'border-l-4 border-l-amber-500'
      : accent === 'emerald'
      ? 'border-l-4 border-l-emerald-500'
      : accent === 'purple'
      ? 'border-l-4 border-l-purple-500'
      : 'border-l-4 border-l-slate-400';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer flex flex-col justify-between ${borderAccent}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{value}</div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{subtext}</div>
      </div>
    </div>
  );
};
