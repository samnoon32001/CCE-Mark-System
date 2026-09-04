import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Lock,
  Unlock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Database,
  RefreshCw,
  AlertTriangle,
  Server,
  Layers,
  FileCheck,
  Radio,
  Check,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const SettingsView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const state = dataService.getState();
  const [, setRerender] = useState(0);

  // Sync state tracking
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'connected' | 'error'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<string>(dataService.getLastSyncTime() || new Date().toLocaleTimeString());
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Academic Year State
  const [newYearInput, setNewYearInput] = useState('');
  const [yearError, setYearError] = useState<string | null>(null);
  const [yearSuccess, setYearSuccess] = useState<string | null>(null);
  const [deletingYearId, setDeletingYearId] = useState<string | null>(null);

  // Lock status
  const isLevelLocked = dataService.isLevelAddingLocked();
  const isMarkLocked = dataService.isMarkEntryLocked();

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setRerender((v) => v + 1);
      setLastSyncTime(dataService.getLastSyncTime() || new Date().toLocaleTimeString());
    });
    return unsub;
  }, []);

  const handleToggleLevelLock = () => {
    const nextVal = !isLevelLocked;
    const actor = currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : undefined;
    dataService.setLevelAddingLocked(nextVal, actor);
  };

  const handleToggleMarkLock = () => {
    const nextVal = !isMarkLocked;
    const actor = currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : undefined;
    dataService.setMarkEntryLocked(nextVal, actor);
  };

  const handleSetCurrentAcademicYear = (year: string) => {
    dataService.setCurrentAcademicYear(year);
    setYearSuccess(`Active academic year set to ${year}`);
    setTimeout(() => setYearSuccess(null), 3000);
  };

  const handleAddAcademicYear = (e: React.FormEvent) => {
    e.preventDefault();
    setYearError(null);
    setYearSuccess(null);

    const clean = newYearInput.trim();
    if (!clean) {
      setYearError('Please enter an academic year (e.g., 2026-2027).');
      return;
    }

    if (!/^\d{4}-\d{4}$/.test(clean)) {
      setYearError('Format should be YYYY-YYYY (e.g., 2026-2027).');
      return;
    }

    if (state.academicYears.some((ay) => ay.year === clean)) {
      setYearError(`Academic year ${clean} already exists.`);
      return;
    }

    dataService.addAcademicYear(clean);
    setNewYearInput('');
    setYearSuccess(`Academic year ${clean} added successfully.`);
    setTimeout(() => setYearSuccess(null), 3000);
  };

  const handleDeleteYear = (id: string) => {
    const target = state.academicYears.find((ay) => ay.id === id);
    if (!target) return;
    if (target.year === state.currentAcademicYear) {
      setYearError('Cannot delete the currently active academic year.');
      return;
    }

    const success = dataService.deleteAcademicYear(id);
    if (success) {
      setYearSuccess(`Academic year ${target.year} removed.`);
      setTimeout(() => setYearSuccess(null), 3000);
    }
    setDeletingYearId(null);
  };

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    setSyncMessage(null);
    try {
      await dataService.syncWithFirestore();
      setSyncStatus('connected');
      setLastSyncTime(new Date().toLocaleTimeString());
      setSyncMessage('Firestore database successfully synchronized!');
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage(`Sync warning: ${err?.message || 'Check network connection'}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            System & Academic Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure institutional locking rules, academic sessions, and live cloud database integration
          </p>
        </div>
      </div>

      {/* 1. Firebase Cloud Signal Card (Moved from Navbar to this Menu as requested) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Firebase Cloud Firestore Signal
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time two-way synchronization active with persistent Google Cloud Firestore instance
              </p>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer w-fit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Firestore Now'}
          </button>
        </div>

        {syncMessage && (
          <div className="mt-4 p-3 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {syncMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Database Instance</div>
            <div className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200 mt-1 truncate" title="ai-studio-studentmarkmanag-a28635d8-791b-4e42-96e4-02e2dcc4ecd6">
              ai-studio-studentmarkmanag...
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Sync Status</div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Live & Synchronized
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Last Handshake</div>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">
              {lastSyncTime}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Audited Records</div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
              {state.marks.length} marks · {state.students.length} students
            </div>
          </div>
        </div>
      </div>

      {/* 2. Institutional Locking System */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Institutional Locking System
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Super admin controls to freeze syllabus configuration or lock mark entries across the entire portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Level Adding Lock */}
          <div className={`p-5 rounded-xl border transition-all ${
            isLevelLocked
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-md ${
                    isLevelLocked ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isLevelLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Lock Evaluation Level Adding
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  When enabled, teachers and non-super-admin users are strictly prevented from adding, renaming, or deleting syllabus evaluation levels.
                </p>
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isLevelLocked
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  }`}>
                    {isLevelLocked ? '● Levels Locked' : '● Levels Open for Editing'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleToggleLevelLock}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer shrink-0 ${
                  isLevelLocked
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300'
                }`}
              >
                {isLevelLocked ? 'Unlock Levels' : 'Lock Levels'}
              </button>
            </div>
          </div>

          {/* Total Mark Entry Lock */}
          <div className={`p-5 rounded-xl border transition-all ${
            isMarkLocked
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-md ${
                    isMarkLocked ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isMarkLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Lock Total Mark Entry
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  When enabled, all faculty mark entry, Excel uploads, and edits are frozen. Mark sheets remain visible in read-only mode for audit and reporting.
                </p>
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isMarkLocked
                      ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  }`}>
                    {isMarkLocked ? '● Mark Entry Frozen' : '● Mark Entry Active'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleToggleMarkLock}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer shrink-0 ${
                  isMarkLocked
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300'
                }`}
              >
                {isMarkLocked ? 'Unlock Marks' : 'Lock Mark Entry'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Academic Year Management */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Academic Year Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Register academic sessions and choose which academic year is active by default across classes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Active Session:</span>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs rounded-md">
                {state.currentAcademicYear}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {yearError && (
          <div className="mb-4 p-3 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            {yearError}
          </div>
        )}
        {yearSuccess && (
          <div className="mb-4 p-3 text-xs rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {yearSuccess}
          </div>
        )}

        {/* Add new academic year form */}
        <form onSubmit={handleAddAcademicYear} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={newYearInput}
            onChange={(e) => setNewYearInput(e.target.value)}
            placeholder="Add new academic year (e.g. 2026-2027)"
            className="flex-1 px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Academic Year
          </button>
        </form>

        {/* Academic Years List */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Associated Classes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.academicYears.map((ay) => {
                const isCurrent = ay.year === state.currentAcademicYear;
                const classCount = state.classes.filter((c) => c.academicYear === ay.year).length;

                return (
                  <tr key={ay.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {ay.year}
                    </td>
                    <td className="py-3.5 px-4">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Current Active Session
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Standard Session</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {classCount} {classCount === 1 ? 'Class' : 'Classes'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrent && (
                          <button
                            onClick={() => handleSetCurrentAcademicYear(ay.year)}
                            className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-xs font-semibold transition cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                        {!isCurrent && (
                          <button
                            onClick={() => setDeletingYearId(ay.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer"
                            title="Delete Academic Year"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Year Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingYearId}
        onClose={() => setDeletingYearId(null)}
        onConfirm={() => deletingYearId && handleDeleteYear(deletingYearId)}
        title="Delete Academic Year"
        message="Are you sure you want to remove this academic year? Classes already assigned to this year will remain intact."
        confirmText="Delete Year"
        isDestructive={true}
      />
    </div>
  );
};
