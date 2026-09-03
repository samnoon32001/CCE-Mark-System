import React from 'react';
import { dataService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  School,
  BookOpen,
  Users,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import type { NavSection } from '../layout/Sidebar';

export const TeacherDashboard: React.FC<{ onNavigate: (section: NavSection) => void }> = ({
  onNavigate,
}) => {
  const { currentUser, isClassTeacher } = useAuth();
  const state = dataService.getState();

  // Find teacher record
  const teacher = state.teachers.find(
    (t) => t.username === currentUser?.username || t.email === currentUser?.email
  );

  const teacherId = teacher?.id || '';

  // Assigned subjects
  const assignedSubjects = state.subjects.filter(
    (s) => s.assignedTeacherId === teacherId || teacher?.assignedSubjectIds?.includes(s.id)
  );

  // Assigned classes (from subjects + direct assignedClassIds)
  const assignedClassIds = Array.from(
    new Set([
      ...(teacher?.assignedClassIds || []),
      ...assignedSubjects.map((s) => s.classId),
    ])
  );
  const assignedClasses = state.classes.filter((c) => assignedClassIds.includes(c.id));

  // Enrolled students in teacher's classes
  const teacherStudents = state.students.filter((s) => assignedClassIds.includes(s.classId));

  // Marks entered for teacher's subjects
  const teacherSubjectIds = assignedSubjects.map((s) => s.id);
  const teacherMarks = state.marks.filter((m) => teacherSubjectIds.includes(m.subjectId));

  // Class teacher classes
  const classTeacherClasses = state.classes.filter(
    (c) => c.classTeacherId === teacherId || teacher?.classTeacherOfClassIds?.includes(c.id)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white shadow-xs border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 uppercase tracking-wider border border-slate-700">
              Instructor Portal
            </span>
            {isClassTeacher && (
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-400/20 text-amber-300 uppercase tracking-wider flex items-center gap-1 border border-amber-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Class Teacher Appointed
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {teacher?.name || currentUser?.name}
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Manage your evaluation marks, enter continuous assessments, and review student performance metrics for academic year {state.currentAcademicYear}.
          </p>
        </div>

        <button
          onClick={() => onNavigate('mark-entry')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors shrink-0 flex items-center gap-2 justify-center"
        >
          <CheckSquare className="w-4 h-4" />
          Open Mark Entry Matrix →
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('teacher-classes')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition cursor-pointer border-l-4 border-l-indigo-500 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">My Classes</span>
            <span className="text-slate-400"><School className="w-4 h-4" /></span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {assignedClasses.length < 10 ? `0${assignedClasses.length}` : assignedClasses.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Teaching Sections</div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('teacher-subjects')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition cursor-pointer border-l-4 border-l-purple-500 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">My Subjects</span>
            <span className="text-slate-400"><BookOpen className="w-4 h-4" /></span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {assignedSubjects.length < 10 ? `0${assignedSubjects.length}` : assignedSubjects.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Allocated Courses</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Students</span>
            <span className="text-slate-400"><Users className="w-4 h-4" /></span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {teacherStudents.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across your cohorts</div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('mark-entry')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition cursor-pointer border-l-4 border-l-amber-500 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Marks Logged</span>
            <span className="text-slate-400"><CheckSquare className="w-4 h-4" /></span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {teacherMarks.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">CCE Level Records</div>
          </div>
        </div>
      </div>

      {/* Class Teacher Responsibility Highlight (if assigned) */}
      {classTeacherClasses.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-950">
                Class Teacher Supervision Role Active
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                You are assigned as Class Teacher for:{' '}
                <span className="font-semibold">
                  {classTeacherClasses.map((c) => c.name).join(', ')}
                </span>
                . You have exclusive access to view consolidated student performance across all subjects.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('class-teacher-view')}
            className="px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-md transition shrink-0 shadow-xs"
          >
            Open Class Teacher View →
          </button>
        </div>
      )}

      {/* Assigned Subjects Grid */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              My Assigned Subjects & Mark Entry Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any subject below to enter or edit student marks
            </p>
          </div>
          <button
            onClick={() => onNavigate('teacher-subjects')}
            className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700"
          >
            All Subjects <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedSubjects.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-slate-400 text-sm">
              No subjects currently assigned to your instructor profile.
            </div>
          ) : (
            assignedSubjects.map((sub) => {
              const cls = state.classes.find((c) => c.id === sub.classId);
              const studentsCount = state.students.filter((s) => s.classId === sub.classId).length;
              const levels = state.evaluationLevels.filter((l) => l.subjectId === sub.id);
              const marksCount = state.marks.filter((m) => m.subjectId === sub.id).length;

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {sub.code}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                        {cls?.name || 'Class'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {sub.name}
                    </h3>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>{studentsCount} Enrolled Students</span>
                      <span>{levels.length} CCE Levels</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigate('evaluation-levels')}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition"
                      title="Manage Evaluation Levels"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-500" />
                      Levels ({levels.length})
                    </button>
                    <button
                      onClick={() => onNavigate('mark-entry')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition"
                    >
                      Enter Marks
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
