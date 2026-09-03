import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, type NavSection } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentManagement } from './components/admin/StudentManagement';
import { TeacherManagement } from './components/admin/TeacherManagement';
import { ClassManagement } from './components/admin/ClassManagement';
import { SubjectManagement } from './components/admin/SubjectManagement';
import { EvaluationLevelManagement } from './components/admin/EvaluationLevelManagement';
import { ExcelImportView } from './components/admin/ExcelImportView';
import { ReportsView } from './components/admin/ReportsView';
import { AuditLogView } from './components/admin/AuditLogView';

// Teacher Views
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherClassesView } from './components/teacher/TeacherClassesView';
import { TeacherSubjectsView } from './components/teacher/TeacherSubjectsView';
import { ClassTeacherView } from './components/teacher/ClassTeacherView';
import { MarkEntryView } from './components/marks/MarkEntryView';

// Student Views
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentProfileView } from './components/student/StudentProfileView';
import { StudentSubjectsView } from './components/student/StudentSubjectsView';
import { StudentMarksView } from './components/student/StudentMarksView';

const MainLayout: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [currentSection, setCurrentSection] = useState<NavSection>('admin-dashboard');

  // Sync default section when role changes
  useEffect(() => {
    if (role === 'super_admin') {
      setCurrentSection('admin-dashboard');
    } else if (role === 'teacher') {
      setCurrentSection('teacher-dashboard');
    } else if (role === 'student') {
      setCurrentSection('student-dashboard');
    }
  }, [role]);

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Fixed Full Height Sidebar */}
      <Sidebar currentSection={currentSection} onSelectSection={setCurrentSection} />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header / Navbar */}
        <Navbar currentSection={currentSection} />

        {/* Scrollable Dynamic Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
          <div className="max-w-7xl w-full mx-auto">
            {/* Admin Views */}
            {currentSection === 'admin-dashboard' && (
              <AdminDashboard onNavigate={setCurrentSection} />
            )}
            {currentSection === 'students' && <StudentManagement />}
            {currentSection === 'teachers' && <TeacherManagement />}
            {currentSection === 'classes' && <ClassManagement />}
            {currentSection === 'subjects' && <SubjectManagement />}
            {currentSection === 'evaluation-levels' && (
              <EvaluationLevelManagement onNavigate={setCurrentSection} />
            )}
            {currentSection === 'excel-import' && <ExcelImportView />}
            {currentSection === 'reports' && <ReportsView />}
            {currentSection === 'audit-logs' && <AuditLogView />}

            {/* Teacher Views */}
            {currentSection === 'teacher-dashboard' && (
              <TeacherDashboard onNavigate={setCurrentSection} />
            )}
            {currentSection === 'teacher-classes' && <TeacherClassesView />}
            {currentSection === 'teacher-subjects' && (
              <TeacherSubjectsView onNavigate={setCurrentSection} />
            )}
            {currentSection === 'mark-entry' && <MarkEntryView />}
            {currentSection === 'class-teacher-view' && <ClassTeacherView />}

            {/* Student Views */}
            {currentSection === 'student-dashboard' && (
              <StudentDashboard onNavigate={setCurrentSection} />
            )}
            {currentSection === 'student-profile' && <StudentProfileView />}
            {currentSection === 'student-subjects' && (
              <StudentSubjectsView onNavigate={setCurrentSection} />
            )}
            {currentSection === 'student-marks' && <StudentMarksView />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
