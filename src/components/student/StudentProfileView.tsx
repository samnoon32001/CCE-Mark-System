import React from 'react';
import { dataService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { User, School, Calendar, ShieldCheck, Mail, Phone, Hash } from 'lucide-react';
import { Badge } from '../common/Badge';

export const StudentProfileView: React.FC = () => {
  const { currentUser } = useAuth();
  const state = dataService.getState();

  const student = state.students.find(
    (s) =>
      s.username === currentUser?.username ||
      s.admissionNumber === currentUser?.admissionNumber
  );

  const studentClass = student ? state.classes.find((c) => c.id === student.classId) : null;
  const classTeacher = studentClass
    ? state.teachers.find((t) => t.id === studentClass.classTeacherId)
    : null;

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-400">
        No student profile found for current user session.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          My Student Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Official enrollment credentials and academic cohort records
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        {/* Header with avatar & Admission No */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-2xl flex items-center justify-center shadow-inner">
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {student.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                  Admission No: {student.admissionNumber}
                </span>
                <Badge variant={student.status === 'active' ? 'success' : 'neutral'}>
                  {student.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Class & Section</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {studentClass?.name || 'Class 10A'}
            </span>
            <span className="text-xs text-slate-500 block">
              Academic Year: {studentClass?.academicYear}
            </span>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Academic Information
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" /> Admission Number:
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {student.admissionNumber}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <School className="w-4 h-4 text-slate-400" /> Assigned Class:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {studentClass?.name || 'Unassigned'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" /> Class Teacher:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {classTeacher?.name || 'Assigned Faculty'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Enrollment Date:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {student.createdDate}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Contact & Authentication
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Login Username:
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  @{student.username}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Email:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {student.email || 'Not provided'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> Phone:
                </span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {student.phone || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
