import React from 'react';
import { dataService } from '../../services/db';
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
} from 'lucide-react';
import type { NavSection } from '../layout/Sidebar';

export const AdminDashboard: React.FC<{ onNavigate: (section: NavSection) => void }> = ({
  onNavigate,
}) => {
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Super Admin Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            System metrics, academic distributions, and recent institution activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('students')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
          >
            + Add Student
          </button>
          <button
            onClick={() => onNavigate('excel-import')}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            Import Excel
          </button>
        </div>
      </div>

      {/* Combined Key Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Students Combined Card */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Students Enrolment
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {totalStudents}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered</span>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {activeStudents} Active
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {totalStudents - activeStudents} Inactive
              </span>
            </div>
          </div>
        </div>

        {/* Teachers Combined Card */}
        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-400 dark:hover:border-purple-600 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Faculty & Teachers
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-lg text-purple-600 dark:text-purple-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {totalTeachers}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Faculty</span>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {activeTeachers} Active
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {totalTeachers - activeTeachers} Inactive
              </span>
            </div>
          </div>
        </div>

        {/* Classes Card */}
        <div
          onClick={() => onNavigate('classes')}
          className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Classes & Sections
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {totalClasses}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Divisions</span>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                AY {state.currentAcademicYear}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {totalSubjects} Subjects
              </span>
            </div>
          </div>
        </div>

        {/* Evaluation Progress Card */}
        <div
          onClick={() => onNavigate('evaluation-levels')}
          className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assessment Matrix
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {totalMarks}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Entries Logged</span>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">
                {state.evaluationLevels.length} CCE Levels
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
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
