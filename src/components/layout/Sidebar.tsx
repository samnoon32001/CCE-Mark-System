import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Sliders,
  FileSpreadsheet,
  FileText,
  History,
  CheckSquare,
  ShieldCheck,
  User,
  Award,
  LogOut,
} from 'lucide-react';

export type NavSection =
  | 'admin-dashboard'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'subjects'
  | 'evaluation-levels'
  | 'excel-import'
  | 'reports'
  | 'audit-logs'
  // Teacher
  | 'teacher-dashboard'
  | 'teacher-classes'
  | 'teacher-subjects'
  | 'mark-entry'
  | 'class-teacher-view'
  // Student
  | 'student-dashboard'
  | 'student-profile'
  | 'student-subjects'
  | 'student-marks';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSelectSection }) => {
  const { currentUser, role, isClassTeacher, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'EM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = () => {
    if (role === 'super_admin') return 'Super Administrator';
    if (role === 'teacher') return isClassTeacher ? 'Class & Subject Teacher' : 'Subject Teacher';
    if (role === 'student') return 'Enrolled Student';
    return 'Authorized User';
  };

  const renderNavItems = () => {
    if (role === 'super_admin') {
      return (
        <>
          <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mb-2 px-3">
            Administration
          </div>
          <NavItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            active={currentSection === 'admin-dashboard'}
            onClick={() => onSelectSection('admin-dashboard')}
          />
          <NavItem
            icon={<Users className="w-5 h-5" />}
            label="Students"
            active={currentSection === 'students'}
            onClick={() => onSelectSection('students')}
          />
          <NavItem
            icon={<GraduationCap className="w-5 h-5" />}
            label="Teachers"
            active={currentSection === 'teachers'}
            onClick={() => onSelectSection('teachers')}
          />
          <NavItem
            icon={<School className="w-5 h-5" />}
            label="Classes"
            active={currentSection === 'classes'}
            onClick={() => onSelectSection('classes')}
          />
          <NavItem
            icon={<BookOpen className="w-5 h-5" />}
            label="Subjects"
            active={currentSection === 'subjects'}
            onClick={() => onSelectSection('subjects')}
          />
          <NavItem
            icon={<Sliders className="w-5 h-5" />}
            label="Evaluation Levels"
            active={currentSection === 'evaluation-levels'}
            onClick={() => onSelectSection('evaluation-levels')}
          />

          <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mt-6 mb-2 px-3">
            Data & Reports
          </div>
          <NavItem
            icon={<FileSpreadsheet className="w-5 h-5" />}
            label="Excel Import"
            active={currentSection === 'excel-import'}
            onClick={() => onSelectSection('excel-import')}
          />
          <NavItem
            icon={<FileText className="w-5 h-5" />}
            label="Reports"
            active={currentSection === 'reports'}
            onClick={() => onSelectSection('reports')}
          />
          <NavItem
            icon={<History className="w-5 h-5" />}
            label="Audit Logs"
            active={currentSection === 'audit-logs'}
            onClick={() => onSelectSection('audit-logs')}
          />
        </>
      );
    }

    if (role === 'teacher') {
      return (
        <>
          <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mb-2 px-3">
            Main Menu
          </div>
          <NavItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            active={currentSection === 'teacher-dashboard'}
            onClick={() => onSelectSection('teacher-dashboard')}
          />
          <NavItem
            icon={<BookOpen className="w-5 h-5" />}
            label="My Subjects"
            active={currentSection === 'teacher-subjects'}
            onClick={() => onSelectSection('teacher-subjects')}
          />
          <NavItem
            icon={<School className="w-5 h-5" />}
            label="My Classes"
            active={currentSection === 'teacher-classes'}
            onClick={() => onSelectSection('teacher-classes')}
          />
          <NavItem
            icon={<CheckSquare className="w-5 h-5" />}
            label="Mark Entry"
            active={currentSection === 'mark-entry'}
            onClick={() => onSelectSection('mark-entry')}
          />
          <NavItem
            icon={<Sliders className="w-5 h-5" />}
            label="Evaluation Levels"
            active={currentSection === 'evaluation-levels'}
            onClick={() => onSelectSection('evaluation-levels')}
          />

          {isClassTeacher && (
            <>
              <div className="text-amber-400/90 text-[10px] uppercase font-semibold tracking-wider mt-5 mb-2 px-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Class Teacher Portal
              </div>
              <NavItem
                icon={<ShieldCheck className="w-5 h-5 text-amber-400" />}
                label="Class Teacher View"
                active={currentSection === 'class-teacher-view'}
                onClick={() => onSelectSection('class-teacher-view')}
              />
            </>
          )}

          <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mt-5 mb-2 px-3">
            Reporting
          </div>
          <NavItem
            icon={<FileText className="w-5 h-5" />}
            label="Reports"
            active={currentSection === 'reports'}
            onClick={() => onSelectSection('reports')}
          />
        </>
      );
    }

    if (role === 'student') {
      return (
        <>
          <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mb-2 px-3">
            Student Portal
          </div>
          <NavItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            active={currentSection === 'student-dashboard'}
            onClick={() => onSelectSection('student-dashboard')}
          />
          <NavItem
            icon={<User className="w-5 h-5" />}
            label="My Profile"
            active={currentSection === 'student-profile'}
            onClick={() => onSelectSection('student-profile')}
          />
          <NavItem
            icon={<BookOpen className="w-5 h-5" />}
            label="My Subjects"
            active={currentSection === 'student-subjects'}
            onClick={() => onSelectSection('student-subjects')}
          />
          <NavItem
            icon={<Award className="w-5 h-5" />}
            label="My Marks"
            active={currentSection === 'student-marks'}
            onClick={() => onSelectSection('student-marks')}
          />
          <NavItem
            icon={<FileText className="w-5 h-5" />}
            label="Reports"
            active={currentSection === 'reports'}
            onClick={() => onSelectSection('reports')}
          />
        </>
      );
    }

    return null;
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen text-slate-300">
      {/* Brand Header matching Professional Polish Design */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-lg tracking-tight">DHDC CCE Portal</span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">CCE Evaluation</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {renderNavItems()}
      </nav>

      {/* System Status Indicator */}
      <div className="px-5 py-3 border-t border-slate-800/60 bg-slate-900/90 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          CCE Engine Active
        </span>
        <span className="font-mono text-indigo-400 text-[10px] font-semibold bg-slate-800/80 px-2 py-0.5 rounded">
          Factor: 30
        </span>
      </div>

      {/* User Profile Card matching Professional Polish footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 text-slate-300 bg-slate-950/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-indigo-900 rounded-full border border-indigo-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {getInitials(currentUser?.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">{currentUser?.name || 'User'}</span>
            <span className="text-[10px] text-slate-400 truncate">{getRoleLabel()}</span>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'text-white bg-slate-800 font-semibold'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      <span className={active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
};

