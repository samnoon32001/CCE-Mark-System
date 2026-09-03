import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  KeyRound,
  Info,
  CheckCircle2,
} from 'lucide-react';

type PortalRoleTab = 'student' | 'teacher' | 'super_admin';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<PortalRoleTab>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleTabChange = (tab: PortalRoleTab) => {
    setActiveTab(tab);
    setError(null);
    setSuccessMsg(null);
    setIdentifier('');
    setPassword('');
  };

  const handleFillSample = (tab: PortalRoleTab) => {
    setError(null);
    if (tab === 'student') {
      setIdentifier('1001');
      setPassword('100110011001');
    } else if (tab === 'teacher') {
      setIdentifier('robert.vance');
      setPassword('teacher123');
    } else if (tab === 'super_admin') {
      setIdentifier('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      if (activeTab === 'student') {
        setError('Please enter your Admission Number (e.g., 1001).');
      } else if (activeTab === 'teacher') {
        setError('Please enter your Teacher Username assigned by Super Admin.');
      } else {
        setError('Please enter your Super Admin username.');
      }
      return;
    }

    if (!password) {
      if (activeTab === 'student') {
        setError('Please enter your password (Admission Number 3 times, e.g., 100110011001).');
      } else {
        setError('Please enter your password.');
      }
      return;
    }

    const result = login(cleanIdentifier, password);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    } else {
      setSuccessMsg('Authentication successful! Loading portal...');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-6">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          CCE Evaluation & Mark Management Portal
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          Systematic Role-Based Institutional Access Control
        </p>
      </div>

      {/* Main Authentication Box */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Systematic Role Tabs */}
          <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => handleTabChange('student')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
                activeTab === 'student'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Student</span>
              <span className="hidden md:inline-block text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
                Mark Card
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('teacher')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
                activeTab === 'teacher'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Teacher</span>
              <span className="hidden md:inline-block text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-medium">
                Faculty
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('super_admin')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
                activeTab === 'super_admin'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm border border-purple-200 dark:border-purple-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Super Admin</span>
              <span className="hidden md:inline-block text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-medium">
                All Access
              </span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Context Info Banner per Tab */}
            {activeTab === 'student' && (
              <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  Student Credentials Rule
                </div>
                <div className="text-[12px] text-emerald-700 dark:text-emerald-300">
                  • <strong>Username</strong>: Your Student Admission Number (e.g.{' '}
                  <code className="bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded font-mono font-bold">1001</code>)
                </div>
                <div className="text-[12px] text-emerald-700 dark:text-emerald-300">
                  • <strong>Password</strong>: Your Admission Number repeated 3 times (e.g.{' '}
                  <code className="bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded font-mono font-bold">100110011001</code>)
                </div>
              </div>
            )}

            {activeTab === 'teacher' && (
              <div className="mb-5 p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Teacher Login Policy
                </div>
                <p className="text-[12px] text-blue-700 dark:text-blue-300">
                  Teachers log in with credentials created and assigned by the <strong>Super Admin</strong> in the Faculty Management portal.
                </p>
              </div>
            )}

            {activeTab === 'super_admin' && (
              <div className="mb-5 p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-purple-800 dark:text-purple-300">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Super Administrator Portal (Restricted)
                </div>
                <p className="text-[12px] text-purple-700 dark:text-purple-300">
                  Super Admin has unrestricted full access across all academic classes, faculty profiles, subjects, and student evaluations. Only authorized administrators may log in.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {activeTab === 'student'
                    ? 'Student Admission Number *'
                    : activeTab === 'teacher'
                    ? 'Teacher Username *'
                    : 'Super Admin Username *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    {activeTab === 'student' ? (
                      <GraduationCap className="w-4 h-4" />
                    ) : activeTab === 'teacher' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeTab === 'student'
                        ? 'e.g. 1001'
                        : activeTab === 'teacher'
                        ? 'e.g. robert.vance'
                        : 'admin'
                    }
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {activeTab === 'student'
                      ? 'Password (Admission No 3 times) *'
                      : 'Password *'}
                  </label>
                  {activeTab === 'student' && identifier.trim() && (
                    <span className="text-[11px] text-emerald-600 font-mono">
                      Target: {identifier.trim()}{identifier.trim()}{identifier.trim()}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      activeTab === 'student'
                        ? 'e.g. 100110011001'
                        : 'Enter your assigned password'
                    }
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white transition shadow-sm flex items-center justify-center gap-2 ${
                    activeTab === 'student'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                      : activeTab === 'teacher'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  }`}
                >
                  <span>
                    Sign In as{' '}
                    {activeTab === 'student'
                      ? 'Student'
                      : activeTab === 'teacher'
                      ? 'Teacher'
                      : 'Super Admin'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Systematic Credentials Guide and Test Helper */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  Credentials Reference
                </span>
                <button
                  type="button"
                  onClick={() => handleFillSample(activeTab)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
                >
                  Fill Sample ({activeTab === 'student' ? 'Student 1001' : activeTab === 'teacher' ? 'Teacher Vance' : 'Super Admin'})
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Student:</span>
                    <span className="text-slate-600 dark:text-slate-400 ml-1">
                      Username = Admission No (e.g. <code className="font-mono font-semibold">1001</code>)
                    </span>
                  </div>
                  <span className="font-mono text-emerald-600 font-semibold shrink-0">
                    Pass: 100110011001
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Teacher:</span>
                    <span className="text-slate-600 dark:text-slate-400 ml-1">
                      Created by Super Admin (e.g. <code className="font-mono font-semibold">robert.vance</code>)
                    </span>
                  </div>
                  <span className="font-mono text-blue-600 font-semibold shrink-0">
                    Pass: teacher123
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Super Admin:</span>
                    <span className="text-slate-600 dark:text-slate-400 ml-1">
                      Restricted Access (<code className="font-mono font-semibold">admin</code>)
                    </span>
                  </div>
                  <span className="font-mono text-purple-600 font-semibold shrink-0">
                    Pass: admin123
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Note Footer */}
        <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>All logins are authenticated systematically against Firebase Firestore</span>
        </div>
      </div>
    </div>
  );
};
