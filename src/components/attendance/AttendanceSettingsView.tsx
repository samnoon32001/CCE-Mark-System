import React, { useState } from 'react';
import { Subject, Teacher, AttendanceRulesConfig } from '../../types';
import { dataService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  BookOpen,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Save,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const AttendanceSettingsView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const state = dataService.getState();
  const [, setRerender] = useState(0);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.classes[0]?.id || ''
  );

  const [rules, setRules] = useState<AttendanceRulesConfig>({
    maxOfficialLeavePercent: 10,
    maxCasualLeavePercent: 15,
    maxTotalLeavesPercent: 25,
    maxOfficialCasualCombinedPercent: 15,
    minRequiredAttendancePercent: 85,
    academicLeaveCountedAsPresent: true,
  });

  const subjectsInClass = state.subjects.filter(
    (s) => s.classId === selectedClassId
  );

  const handleToggleSubjectAttendance = (subjectId: string, enabled: boolean) => {
    dataService.setSubjectAttendanceTracking(
      subjectId,
      enabled,
      currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.role } : undefined
    );
    setRerender((v) => v + 1);
  };

  const handleToggleSplitSubject = (subjectId: string, isSplit: boolean) => {
    dataService.updateSubject(
      subjectId,
      { isSplitSubject: isSplit },
      currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.role } : undefined
    );
    setRerender((v) => v + 1);
  };

  const handleToggleTeacherAllAttendance = (teacherId: string, canManage: boolean) => {
    dataService.updateTeacher(
      teacherId,
      { canManageAllAttendance: canManage },
      currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.role } : undefined
    );
    setRerender((v) => v + 1);
  };

  const handleUpdateTeacherRoleTitle = (teacherId: string, title: string) => {
    dataService.updateTeacher(
      teacherId,
      { specialRoleTitle: title },
      currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.role } : undefined
    );
    setRerender((v) => v + 1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-600" />
            Attendance & Subject Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure subject-wise period tracking, split period subjects, teacher clearance roles, and attendance thresholds
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: SUBJECT-WISE ATTENDANCE TRACKING */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Subject Attendance Toggles
              </h3>
            </div>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500">
            Check subjects that require daily 9-period attendance tracking. Unchecked subjects will not show in period attendance selectors.
          </p>

          {subjectsInClass.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No subjects registered for this class.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjectsInClass.map((sub) => {
                const isTracked = sub.trackAttendance !== false;
                const isSplit = !!sub.isSplitSubject;

                return (
                  <div
                    key={sub.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {sub.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Code: {sub.code} {isSplit && '• Split Subject'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Split Subject Checkbox */}
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSplit}
                          onChange={(e) => handleToggleSplitSubject(sub.id, e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>Split Period</span>
                      </label>

                      {/* Track Attendance Toggle */}
                      <button
                        onClick={() => handleToggleSubjectAttendance(sub.id, !isTracked)}
                        className={`px-3 py-1 rounded-xl font-semibold cursor-pointer transition-colors text-xs ${
                          isTracked
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isTracked ? '✓ Tracking Active' : 'Off'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CARD 2: TEACHER ATTENDANCE ACCESS & SPECIAL ROLES */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Faculty Access & Administrative Roles
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            Assign special institutional designations (Principal, Academic Assistant, HoD, HoS) to empower officials to issue clearances, or grant all-subject attendance permissions.
          </p>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {state.teachers.map((tch) => {
              return (
                <div
                  key={tch.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {tch.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        @{tch.username}
                      </div>
                    </div>

                    <select
                      value={tch.specialRoleTitle || ''}
                      onChange={(e) => handleUpdateTeacherRoleTitle(tch.id, e.target.value)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      <option value="">Faculty / Teacher</option>
                      <option value="Principal">Principal</option>
                      <option value="Academic Assistant">Academic Assistant</option>
                      <option value="HoD">Head of Department (HoD)</option>
                      <option value="HoS">Head of School (HoS)</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Can take attendance for all subjects:
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!tch.canManageAllAttendance}
                        onChange={(e) => handleToggleTeacherAllAttendance(tch.id, e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        {tch.canManageAllAttendance ? 'Granted' : 'Restricted'}
                      </span>
                    </label>
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
