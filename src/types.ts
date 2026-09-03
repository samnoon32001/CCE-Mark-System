export type UserRole = 'super_admin' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  admissionNumber?: string;
  status: 'active' | 'inactive';
  password?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  classId: string;
  phone?: string;
  email?: string;
  username: string;
  status: 'active' | 'inactive';
  createdDate: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email: string;
  username: string;
  status: 'active' | 'inactive';
  assignedSubjectIds: string[];
  assignedClassIds: string[];
  classTeacherOfClassIds: string[];
  createdDate: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "Class 8 A"
  academicYear: string; // e.g. "2025-2026"
  classTeacherId?: string;
  status: 'active' | 'inactive';
  createdDate?: string;
}

export interface Subject {
  id: string;
  name: string; // e.g. "English"
  code: string; // e.g. "ENG101"
  classId: string;
  assignedTeacherId?: string;
  status: 'active' | 'inactive';
}

export interface EvaluationLevel {
  id: string;
  subjectId: string;
  name: string; // e.g. "Assignment", "Debate", "Presentation", "Project"
  maximumMark: number;
  maxMark?: number; // Optional alias for convenience
  displayOrder: number;
  status: 'active' | 'inactive';
}

export interface Mark {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  evaluationLevelId: string;
  maximumMark: number;
  obtainedMark: number | null; // null if not entered
  date: string;
  enteredBy: string; // Teacher name or ID
  lastUpdated: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface AcademicYear {
  id: string;
  year: string;
  isCurrent: boolean;
}

export interface StudentSubjectSummary {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  evaluationMarks: {
    levelId: string;
    levelName: string;
    maximumMark: number;
    obtainedMark: number | null;
    status: 'completed' | 'pending';
  }[];
  totalMaximum: number;
  totalObtained: number;
  percentage: number;
  finalWeightedMark: number; // out of 30
  isFullyCompleted: boolean;
}
