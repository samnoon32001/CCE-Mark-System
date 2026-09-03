import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import type {
  User,
  Student,
  Teacher,
  ClassRoom,
  Subject,
  EvaluationLevel,
  Mark,
  AuditLog,
  AcademicYear,
} from '../types';

const STORAGE_KEY = 'student_mark_system_db_v1';

export interface DatabaseState {
  users: User[];
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  evaluationLevels: EvaluationLevel[];
  marks: Mark[];
  auditLogs: AuditLog[];
  academicYears: AcademicYear[];
  currentAcademicYear: string;
}

// Initial robust seed data matching all requirements
const INITIAL_STATE: DatabaseState = {
  academicYears: [
    { id: 'ay-1', year: '2025-2026', isCurrent: true },
    { id: 'ay-2', year: '2024-2025', isCurrent: false },
    { id: 'ay-3', year: '2026-2027', isCurrent: false },
  ],
  currentAcademicYear: '2025-2026',
  users: [
    {
      id: 'user-admin',
      username: 'admin',
      role: 'super_admin',
      name: 'Ashiq CP Hudawi',
      email: 'admin@school.edu',
      phone: '(555) 100-0001',
      status: 'active',
      password: 'admin123',
      createdAt: '2025-01-10T08:00:00.000Z',
    },
    {
      id: 'user-teacher-1',
      username: 'robert.vance',
      role: 'teacher',
      name: 'Mr. Robert Vance',
      email: 'r.vance@school.edu',
      phone: '(555) 234-5678',
      status: 'active',
      password: 'teacher123',
      createdAt: '2025-01-11T09:00:00.000Z',
    },
    {
      id: 'user-teacher-2',
      username: 'sarah.connor',
      role: 'teacher',
      name: 'Ms. Sarah Connor',
      email: 's.connor@school.edu',
      phone: '(555) 345-6789',
      status: 'active',
      password: 'teacher123',
      createdAt: '2025-01-11T09:15:00.000Z',
    },
    {
      id: 'user-teacher-3',
      username: 'albert.stone',
      role: 'teacher',
      name: 'Dr. Albert Stone',
      email: 'a.stone@school.edu',
      phone: '(555) 456-7890',
      status: 'active',
      password: 'teacher123',
      createdAt: '2025-01-11T09:30:00.000Z',
    },
    {
      id: 'user-teacher-4',
      username: 'elena.rostova',
      role: 'teacher',
      name: 'Mrs. Elena Rostova',
      email: 'e.rostova@school.edu',
      phone: '(555) 567-8901',
      status: 'active',
      password: 'teacher123',
      createdAt: '2025-01-11T09:45:00.000Z',
    },
    // Student Users with systematic credentials: username = admissionNumber, password = admissionNumber 3 times
    {
      id: 'user-std-1001',
      username: '1001',
      admissionNumber: '1001',
      role: 'student',
      name: 'Alice Johnson',
      email: 'alice.j@school.edu',
      phone: '(555) 111-1001',
      status: 'active',
      password: '100110011001',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-1002',
      username: '1002',
      admissionNumber: '1002',
      role: 'student',
      name: 'Brian Smith',
      email: 'brian.s@school.edu',
      phone: '(555) 111-1002',
      status: 'active',
      password: '100210021002',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-1003',
      username: '1003',
      admissionNumber: '1003',
      role: 'student',
      name: 'Chloe Davis',
      email: 'chloe.d@school.edu',
      phone: '(555) 111-1003',
      status: 'active',
      password: '100310031003',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-1004',
      username: '1004',
      admissionNumber: '1004',
      role: 'student',
      name: 'Daniel Martinez',
      email: 'daniel.m@school.edu',
      phone: '(555) 111-1004',
      status: 'active',
      password: '100410041004',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-1005',
      username: '1005',
      admissionNumber: '1005',
      role: 'student',
      name: 'Emily Taylor',
      email: 'emily.t@school.edu',
      phone: '(555) 111-1005',
      status: 'active',
      password: '100510051005',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-1006',
      username: '1006',
      admissionNumber: '1006',
      role: 'student',
      name: 'Frank Thomas',
      email: 'frank.t@school.edu',
      phone: '(555) 111-1006',
      status: 'active',
      password: '100610061006',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-2001',
      username: '2001',
      admissionNumber: '2001',
      role: 'student',
      name: 'Grace Hopper',
      email: 'grace.h@school.edu',
      phone: '(555) 222-2001',
      status: 'active',
      password: '200120012001',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-2002',
      username: '2002',
      admissionNumber: '2002',
      role: 'student',
      name: 'Henry Ford',
      email: 'henry.f@school.edu',
      phone: '(555) 222-2002',
      status: 'active',
      password: '200220022002',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-2003',
      username: '2003',
      admissionNumber: '2003',
      role: 'student',
      name: 'Isabella Clark',
      email: 'isabella.c@school.edu',
      phone: '(555) 222-2003',
      status: 'active',
      password: '200320032003',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-2004',
      username: '2004',
      admissionNumber: '2004',
      role: 'student',
      name: 'Jack Robinson',
      email: 'jack.r@school.edu',
      phone: '(555) 222-2004',
      status: 'active',
      password: '200420042004',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-2005',
      username: '2005',
      admissionNumber: '2005',
      role: 'student',
      name: 'Katherine Lewis',
      email: 'katherine.l@school.edu',
      phone: '(555) 222-2005',
      status: 'active',
      password: '200520052005',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'user-std-2006',
      username: '2006',
      admissionNumber: '2006',
      role: 'student',
      name: 'Liam Wilson',
      email: 'liam.w@school.edu',
      phone: '(555) 222-2006',
      status: 'active',
      password: '200620062006',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
  ],
  classes: [
    {
      id: 'class-8a',
      name: 'Class 8 A',
      academicYear: '2025-2026',
      classTeacherId: 'teacher-1', // Robert Vance
      status: 'active',
    },
    {
      id: 'class-10a',
      name: 'Class 10 A',
      academicYear: '2025-2026',
      classTeacherId: 'teacher-2', // Sarah Connor
      status: 'active',
    },
  ],
  teachers: [
    {
      id: 'teacher-1',
      name: 'Mr. Robert Vance',
      phone: '(555) 234-5678',
      email: 'r.vance@school.edu',
      username: 'robert.vance',
      status: 'active',
      assignedSubjectIds: ['sub-8a-eng', 'sub-10a-eng'],
      assignedClassIds: ['class-8a', 'class-10a'],
      classTeacherOfClassIds: ['class-8a'],
      createdDate: '2025-01-11',
    },
    {
      id: 'teacher-2',
      name: 'Ms. Sarah Connor',
      phone: '(555) 345-6789',
      email: 's.connor@school.edu',
      username: 'sarah.connor',
      status: 'active',
      assignedSubjectIds: ['sub-8a-mat', 'sub-10a-mat'],
      assignedClassIds: ['class-8a', 'class-10a'],
      classTeacherOfClassIds: ['class-10a'],
      createdDate: '2025-01-11',
    },
    {
      id: 'teacher-3',
      name: 'Dr. Albert Stone',
      phone: '(555) 456-7890',
      email: 'a.stone@school.edu',
      username: 'albert.stone',
      status: 'active',
      assignedSubjectIds: ['sub-8a-sci', 'sub-10a-sci'],
      assignedClassIds: ['class-8a', 'class-10a'],
      classTeacherOfClassIds: [],
      createdDate: '2025-01-11',
    },
    {
      id: 'teacher-4',
      name: 'Mrs. Elena Rostova',
      phone: '(555) 567-8901',
      email: 'e.rostova@school.edu',
      username: 'elena.rostova',
      status: 'active',
      assignedSubjectIds: ['sub-8a-soc'],
      assignedClassIds: ['class-8a'],
      classTeacherOfClassIds: [],
      createdDate: '2025-01-11',
    },
  ],
  students: [
    {
      id: 'std-1001',
      admissionNumber: '1001',
      name: 'Alice Johnson',
      classId: 'class-8a',
      phone: '(555) 111-1001',
      email: 'alice.j@school.edu',
      username: 'alice1001',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-1002',
      admissionNumber: '1002',
      name: 'Brian Smith',
      classId: 'class-8a',
      phone: '(555) 111-1002',
      email: 'brian.s@school.edu',
      username: 'brian1002',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-1003',
      admissionNumber: '1003',
      name: 'Chloe Davis',
      classId: 'class-8a',
      phone: '(555) 111-1003',
      email: 'chloe.d@school.edu',
      username: 'chloe1003',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-1004',
      admissionNumber: '1004',
      name: 'Daniel Martinez',
      classId: 'class-8a',
      phone: '(555) 111-1004',
      email: 'daniel.m@school.edu',
      username: 'daniel1004',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-1005',
      admissionNumber: '1005',
      name: 'Emily Taylor',
      classId: 'class-8a',
      phone: '(555) 111-1005',
      email: 'emily.t@school.edu',
      username: 'emily1005',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-1006',
      admissionNumber: '1006',
      name: 'Frank Thomas',
      classId: 'class-8a',
      phone: '(555) 111-1006',
      email: 'frank.t@school.edu',
      username: 'frank1006',
      status: 'active',
      createdDate: '2025-01-15',
    },
    // Class 10 A students
    {
      id: 'std-2001',
      admissionNumber: '2001',
      name: 'Grace Hopper',
      classId: 'class-10a',
      phone: '(555) 222-2001',
      email: 'grace.h@school.edu',
      username: 'grace2001',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-2002',
      admissionNumber: '2002',
      name: 'Henry Ford',
      classId: 'class-10a',
      phone: '(555) 222-2002',
      email: 'henry.f@school.edu',
      username: 'henry2002',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-2003',
      admissionNumber: '2003',
      name: 'Isabella Clark',
      classId: 'class-10a',
      phone: '(555) 222-2003',
      email: 'isabella.c@school.edu',
      username: 'isabella2003',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-2004',
      admissionNumber: '2004',
      name: 'Jack Robinson',
      classId: 'class-10a',
      phone: '(555) 222-2004',
      email: 'jack.r@school.edu',
      username: 'jack2004',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-2005',
      admissionNumber: '2005',
      name: 'Katherine Lewis',
      classId: 'class-10a',
      phone: '(555) 222-2005',
      email: 'katherine.l@school.edu',
      username: 'katherine2005',
      status: 'active',
      createdDate: '2025-01-15',
    },
    {
      id: 'std-2006',
      admissionNumber: '2006',
      name: 'Liam Wilson',
      classId: 'class-10a',
      phone: '(555) 222-2006',
      email: 'liam.w@school.edu',
      username: 'liam2006',
      status: 'active',
      createdDate: '2025-01-15',
    },
  ],
  subjects: [
    {
      id: 'sub-8a-eng',
      name: 'English',
      code: 'ENG801',
      classId: 'class-8a',
      assignedTeacherId: 'teacher-1',
      status: 'active',
    },
    {
      id: 'sub-8a-mat',
      name: 'Mathematics',
      code: 'MAT801',
      classId: 'class-8a',
      assignedTeacherId: 'teacher-2',
      status: 'active',
    },
    {
      id: 'sub-8a-sci',
      name: 'Science',
      code: 'SCI801',
      classId: 'class-8a',
      assignedTeacherId: 'teacher-3',
      status: 'active',
    },
    {
      id: 'sub-8a-soc',
      name: 'Social Science',
      code: 'SOC801',
      classId: 'class-8a',
      assignedTeacherId: 'teacher-4',
      status: 'active',
    },
    {
      id: 'sub-10a-eng',
      name: 'English',
      code: 'ENG1001',
      classId: 'class-10a',
      assignedTeacherId: 'teacher-1',
      status: 'active',
    },
    {
      id: 'sub-10a-mat',
      name: 'Mathematics',
      code: 'MAT1001',
      classId: 'class-10a',
      assignedTeacherId: 'teacher-2',
      status: 'active',
    },
    {
      id: 'sub-10a-sci',
      name: 'Science',
      code: 'SCI1001',
      classId: 'class-10a',
      assignedTeacherId: 'teacher-3',
      status: 'active',
    },
  ],
  evaluationLevels: [
    // English Class 8A (Total Max = 100)
    {
      id: 'eval-eng8-1',
      subjectId: 'sub-8a-eng',
      name: 'Assignment',
      maximumMark: 20,
      displayOrder: 1,
      status: 'active',
    },
    {
      id: 'eval-eng8-2',
      subjectId: 'sub-8a-eng',
      name: 'Debate',
      maximumMark: 10,
      displayOrder: 2,
      status: 'active',
    },
    {
      id: 'eval-eng8-3',
      subjectId: 'sub-8a-eng',
      name: 'Presentation',
      maximumMark: 20,
      displayOrder: 3,
      status: 'active',
    },
    {
      id: 'eval-eng8-4',
      subjectId: 'sub-8a-eng',
      name: 'Project',
      maximumMark: 50,
      displayOrder: 4,
      status: 'active',
    },
    // Mathematics Class 8A (Total Max = 100)
    {
      id: 'eval-mat8-1',
      subjectId: 'sub-8a-mat',
      name: 'Assignment',
      maximumMark: 20,
      displayOrder: 1,
      status: 'active',
    },
    {
      id: 'eval-mat8-2',
      subjectId: 'sub-8a-mat',
      name: 'Quiz',
      maximumMark: 20,
      displayOrder: 2,
      status: 'active',
    },
    {
      id: 'eval-mat8-3',
      subjectId: 'sub-8a-mat',
      name: 'Project',
      maximumMark: 60,
      displayOrder: 3,
      status: 'active',
    },
    // Science Class 8A (Total Max = 100)
    {
      id: 'eval-sci8-1',
      subjectId: 'sub-8a-sci',
      name: 'Lab Practical',
      maximumMark: 25,
      displayOrder: 1,
      status: 'active',
    },
    {
      id: 'eval-sci8-2',
      subjectId: 'sub-8a-sci',
      name: 'Theory Test',
      maximumMark: 25,
      displayOrder: 2,
      status: 'active',
    },
    {
      id: 'eval-sci8-3',
      subjectId: 'sub-8a-sci',
      name: 'Science Fair Project',
      maximumMark: 50,
      displayOrder: 3,
      status: 'active',
    },
    // Social Science Class 8A (Total Max = 70 -> Tests variable max marks!)
    {
      id: 'eval-soc8-1',
      subjectId: 'sub-8a-soc',
      name: 'Assignment',
      maximumMark: 25,
      displayOrder: 1,
      status: 'active',
    },
    {
      id: 'eval-soc8-2',
      subjectId: 'sub-8a-soc',
      name: 'Debate',
      maximumMark: 15,
      displayOrder: 2,
      status: 'active',
    },
    {
      id: 'eval-soc8-3',
      subjectId: 'sub-8a-soc',
      name: 'Project',
      maximumMark: 30,
      displayOrder: 3,
      status: 'active',
    },
    // English Class 10A
    {
      id: 'eval-eng10-1',
      subjectId: 'sub-10a-eng',
      name: 'Assignment',
      maximumMark: 20,
      displayOrder: 1,
      status: 'active',
    },
    {
      id: 'eval-eng10-2',
      subjectId: 'sub-10a-eng',
      name: 'Debate',
      maximumMark: 10,
      displayOrder: 2,
      status: 'active',
    },
    {
      id: 'eval-eng10-3',
      subjectId: 'sub-10a-eng',
      name: 'Presentation',
      maximumMark: 20,
      displayOrder: 3,
      status: 'active',
    },
    {
      id: 'eval-eng10-4',
      subjectId: 'sub-10a-eng',
      name: 'Project',
      maximumMark: 50,
      displayOrder: 4,
      status: 'active',
    },
  ],
  marks: [
    // Alice Johnson (std-1001) in English (sub-8a-eng)
    // 18/20 + 8/10 + 15/20 + 40/50 = 81/100 -> 24.30 / 30!
    {
      id: 'mark-1001-eng-1',
      studentId: 'std-1001',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-1',
      maximumMark: 20,
      obtainedMark: 18,
      date: '2025-02-10',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-10T14:30:00Z',
    },
    {
      id: 'mark-1001-eng-2',
      studentId: 'std-1001',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-2',
      maximumMark: 10,
      obtainedMark: 8,
      date: '2025-02-12',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-12T11:20:00Z',
    },
    {
      id: 'mark-1001-eng-3',
      studentId: 'std-1001',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-3',
      maximumMark: 20,
      obtainedMark: 15,
      date: '2025-02-15',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-15T15:00:00Z',
    },
    {
      id: 'mark-1001-eng-4',
      studentId: 'std-1001',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-4',
      maximumMark: 50,
      obtainedMark: 40,
      date: '2025-02-20',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-20T16:45:00Z',
    },

    // Brian Smith (std-1002) in English
    {
      id: 'mark-1002-eng-1',
      studentId: 'std-1002',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-1',
      maximumMark: 20,
      obtainedMark: 15,
      date: '2025-02-10',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-10T14:30:00Z',
    },
    // Debate is PENDING for Brian Smith
    {
      id: 'mark-1002-eng-3',
      studentId: 'std-1002',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-3',
      maximumMark: 20,
      obtainedMark: 16,
      date: '2025-02-15',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-15T15:00:00Z',
    },
    {
      id: 'mark-1002-eng-4',
      studentId: 'std-1002',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-4',
      maximumMark: 50,
      obtainedMark: 44,
      date: '2025-02-20',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-20T16:45:00Z',
    },

    // Chloe Davis (std-1003) in English
    {
      id: 'mark-1003-eng-1',
      studentId: 'std-1003',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-1',
      maximumMark: 20,
      obtainedMark: 20,
      date: '2025-02-10',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-10T14:30:00Z',
    },
    {
      id: 'mark-1003-eng-2',
      studentId: 'std-1003',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-2',
      maximumMark: 10,
      obtainedMark: 9,
      date: '2025-02-12',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-12T11:20:00Z',
    },
    {
      id: 'mark-1003-eng-3',
      studentId: 'std-1003',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-3',
      maximumMark: 20,
      obtainedMark: 18,
      date: '2025-02-15',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-15T15:00:00Z',
    },
    {
      id: 'mark-1003-eng-4',
      studentId: 'std-1003',
      classId: 'class-8a',
      subjectId: 'sub-8a-eng',
      evaluationLevelId: 'eval-eng8-4',
      maximumMark: 50,
      obtainedMark: 43,
      date: '2025-02-20',
      enteredBy: 'Mr. Robert Vance',
      lastUpdated: '2025-02-20T16:45:00Z',
    },

    // Alice Johnson in Social Science (sub-8a-soc, max 70)
    // 22/25 + 12/15 + 22/30 = 56 / 70 -> 24.00 / 30!
    {
      id: 'mark-1001-soc-1',
      studentId: 'std-1001',
      classId: 'class-8a',
      subjectId: 'sub-8a-soc',
      evaluationLevelId: 'eval-soc8-1',
      maximumMark: 25,
      obtainedMark: 22,
      date: '2025-02-14',
      enteredBy: 'Mrs. Elena Rostova',
      lastUpdated: '2025-02-14T10:00:00Z',
    },
    {
      id: 'mark-1001-soc-2',
      studentId: 'std-1001',
      classId: 'class-8a',
      subjectId: 'sub-8a-soc',
      evaluationLevelId: 'eval-soc8-2',
      maximumMark: 15,
      obtainedMark: 12,
      date: '2025-02-16',
      enteredBy: 'Mrs. Elena Rostova',
      lastUpdated: '2025-02-16T11:00:00Z',
    },
    {
      id: 'mark-1001-soc-3',
      studentId: 'std-1001',
      classId: 'class-8a',
      subjectId: 'sub-8a-soc',
      evaluationLevelId: 'eval-soc8-3',
      maximumMark: 30,
      obtainedMark: 22,
      date: '2025-02-19',
      enteredBy: 'Mrs. Elena Rostova',
      lastUpdated: '2025-02-19T14:00:00Z',
    },
  ],
  auditLogs: [
    {
      id: 'log-1',
      userId: 'user-admin',
      userName: 'Ashiq CP Hudawi',
      role: 'super_admin',
      action: 'System Initialized',
      entity: 'System',
      entityId: 'SYS',
      details: 'Initial classes, subjects, and evaluation levels configured',
      timestamp: '2025-01-10T08:00:00.000Z',
    },
    {
      id: 'log-2',
      userId: 'user-teacher-1',
      userName: 'Mr. Robert Vance',
      role: 'teacher',
      action: 'Entered Marks',
      entity: 'Mark',
      entityId: 'sub-8a-eng',
      details: 'Entered Assignment marks for Class 8 A English (Alice Johnson: 18/20)',
      timestamp: '2025-02-10T14:30:00.000Z',
    },
    {
      id: 'log-3',
      userId: 'user-teacher-1',
      userName: 'Mr. Robert Vance',
      role: 'teacher',
      action: 'Entered Marks',
      entity: 'Mark',
      entityId: 'sub-8a-eng',
      details: 'Completed CCE Project evaluation for Class 8 A English',
      timestamp: '2025-02-20T16:45:00.000Z',
    },
  ],
};

class DataService {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();
  private isSyncingWithFirestore = false;
  private syncStatus: 'connected' | 'syncing' | 'offline' | 'error' | 'connecting' = 'connecting';
  private lastSyncTime: string | null = null;
  private syncError: string | null = null;

  constructor() {
    this.state = this.loadLocal();
    this.initFirestoreSync();
  }

  private loadLocal(): DatabaseState {
    let state: DatabaseState;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        state = {
          ...INITIAL_STATE,
          ...parsed,
        };
      } else {
        state = JSON.parse(JSON.stringify(INITIAL_STATE));
      }
    } catch (e) {
      console.error('Error loading local state:', e);
      state = JSON.parse(JSON.stringify(INITIAL_STATE));
    }

    // System rule: ensure every student has a user account with username = admissionNumber
    // and password = admissionNumber repeated 3 times (e.g., '1001' -> '100110011001')
    if (state.students && state.users) {
      state.students.forEach((s) => {
        const expectedStudentPass = `${s.admissionNumber}${s.admissionNumber}${s.admissionNumber}`;
        const existingUserIdx = state.users.findIndex(
          (u) =>
            u.admissionNumber === s.admissionNumber ||
            u.id === `user-${s.id}` ||
            u.username.toLowerCase() === s.admissionNumber.toLowerCase()
        );

        if (existingUserIdx === -1) {
          state.users.push({
            id: `user-${s.id}`,
            username: s.admissionNumber,
            admissionNumber: s.admissionNumber,
            role: 'student',
            name: s.name,
            email: s.email,
            phone: s.phone,
            status: s.status,
            password: expectedStudentPass,
            createdAt: new Date().toISOString(),
          });
        } else {
          state.users[existingUserIdx].admissionNumber = s.admissionNumber;
          state.users[existingUserIdx].username = s.admissionNumber;
          if (!state.users[existingUserIdx].password || state.users[existingUserIdx].password === 'student123') {
            state.users[existingUserIdx].password = expectedStudentPass;
          }
        }
      });
    }

    // Systematic rule: ensure super_admin user always exists with password admin123
    if (!state.users) {
      state.users = JSON.parse(JSON.stringify(INITIAL_STATE.users));
    }
    const adminUser = state.users.find((u) => u.role === 'super_admin' || u.username === 'admin');
    if (!adminUser) {
      state.users.unshift({
        id: 'user-admin',
        username: 'admin',
        role: 'super_admin',
        name: 'Ashiq CP Hudawi',
        email: 'admin@school.edu',
        phone: '(555) 100-0001',
        status: 'active',
        password: 'admin123',
        createdAt: new Date().toISOString(),
      });
    } else {
      if (adminUser.name === 'Dr. Evelyn Reed (Super Admin)' || !adminUser.name) {
        adminUser.name = 'Ashiq CP Hudawi';
      }
      if (!adminUser.password) {
        adminUser.password = 'admin123';
      }
    }

    // Systematic rule: ensure all teacher users have a password (defaults to teacher123)
    state.users.forEach((u) => {
      if (u.role === 'teacher' && !u.password) {
        u.password = 'teacher123';
      }
    });

    return state;
  }

  private saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving local state:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public getFirebaseInfo() {
    return {
      status: this.syncStatus,
      lastSyncTime: this.lastSyncTime,
      error: this.syncError,
      databaseId: 'ai-studio-studentmarkmanag-a28635d8-791b-4e42-96e4-02e2dcc4ecd6',
      projectId: 'astute-runway-96shk',
    };
  }

  public async syncWithFirestore(): Promise<boolean> {
    return this.initFirestoreSync();
  }

  // Synchronize with Firestore in background or on user request
  public async initFirestoreSync(): Promise<boolean> {
    if (this.isSyncingWithFirestore) return true;
    this.isSyncingWithFirestore = true;
    this.syncStatus = 'syncing';
    this.notify();

    try {
      // Check if Firestore has users collection
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        // Seed initial data to Firestore
        const batch = writeBatch(db);
        this.state.users.forEach((u) => {
          batch.set(doc(db, 'users', u.id), u);
        });
        this.state.classes.forEach((c) => {
          batch.set(doc(db, 'classes', c.id), c);
        });
        this.state.students.forEach((s) => {
          batch.set(doc(db, 'students', s.id), s);
        });
        this.state.teachers.forEach((t) => {
          batch.set(doc(db, 'teachers', t.id), t);
        });
        this.state.subjects.forEach((sub) => {
          batch.set(doc(db, 'subjects', sub.id), sub);
        });
        this.state.evaluationLevels.forEach((el) => {
          batch.set(doc(db, 'evaluation_levels', el.id), el);
        });
        this.state.marks.forEach((m) => {
          batch.set(doc(db, 'marks', m.id), m);
        });
        await batch.commit();
        console.log('Successfully seeded database to Firestore');
      } else {
        // Load data from Firestore to keep client state synchronized
        const [
          classesSnap,
          studentsSnap,
          teachersSnap,
          subjectsSnap,
          evalSnap,
          marksSnap,
          logsSnap,
        ] = await Promise.all([
          getDocs(collection(db, 'classes')),
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'teachers')),
          getDocs(collection(db, 'subjects')),
          getDocs(collection(db, 'evaluation_levels')),
          getDocs(collection(db, 'marks')),
          getDocs(collection(db, 'audit_logs')),
        ]);

        if (!usersSnap.empty) {
          this.state.users = usersSnap.docs.map((d) => {
            const u = d.data() as User;
            if (u.role === 'super_admin' && !u.password) {
              u.password = 'admin123';
            } else if (u.role === 'teacher' && !u.password) {
              u.password = 'teacher123';
            } else if (u.role === 'student' && !u.password) {
              u.password = u.admissionNumber ? `${u.admissionNumber}${u.admissionNumber}${u.admissionNumber}` : 'student123';
            }
            return u;
          });

          // Guarantee super_admin user exists
          const hasAdmin = this.state.users.some((u) => u.role === 'super_admin' || u.username === 'admin');
          if (!hasAdmin) {
            const defaultAdmin: User = {
              id: 'user-admin',
              username: 'admin',
              role: 'super_admin',
              name: 'Ashiq CP Hudawi',
              email: 'admin@school.edu',
              phone: '(555) 100-0001',
              status: 'active',
              password: 'admin123',
              createdAt: new Date().toISOString(),
            };
            this.state.users.unshift(defaultAdmin);
            setDoc(doc(db, 'users', 'user-admin'), defaultAdmin, { merge: true }).catch(() => {});
          } else {
            const adminDoc = this.state.users.find((u) => u.role === 'super_admin' || u.username === 'admin');
            if (adminDoc) {
              if (adminDoc.name === 'Dr. Evelyn Reed (Super Admin)' || !adminDoc.name) {
                adminDoc.name = 'Ashiq CP Hudawi';
                setDoc(doc(db, 'users', adminDoc.id), { name: 'Ashiq CP Hudawi' }, { merge: true }).catch(() => {});
              }
              if (!adminDoc.password) {
                adminDoc.password = 'admin123';
                setDoc(doc(db, 'users', adminDoc.id), { password: 'admin123' }, { merge: true }).catch(() => {});
              }
            }
          }
        }
        if (!classesSnap.empty) {
          this.state.classes = classesSnap.docs.map((d) => d.data() as ClassRoom);
        }
        if (!studentsSnap.empty) {
          this.state.students = studentsSnap.docs.map((d) => d.data() as Student);
        }
        if (!teachersSnap.empty) {
          this.state.teachers = teachersSnap.docs.map((d) => d.data() as Teacher);
        }
        if (!subjectsSnap.empty) {
          this.state.subjects = subjectsSnap.docs.map((d) => d.data() as Subject);
        }
        if (!evalSnap.empty) {
          this.state.evaluationLevels = evalSnap.docs.map((d) => d.data() as EvaluationLevel);
        }
        if (!marksSnap.empty) {
          this.state.marks = marksSnap.docs.map((d) => d.data() as Mark);
        }
        if (!logsSnap.empty) {
          this.state.auditLogs = logsSnap.docs.map((d) => d.data() as AuditLog);
        }

        this.saveLocal();
      }

      this.syncStatus = 'connected';
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.syncError = null;
      this.notify();
      return true;
    } catch (e: any) {
      console.warn('Firestore sync note:', e);
      this.syncStatus = 'connected';
      this.syncError = e?.message || null;
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.notify();
      return false;
    } finally {
      this.isSyncingWithFirestore = false;
    }
  }

  // --- USER AUTHENTICATION & CREDENTIALS ---
  public saveLocalState() {
    this.saveLocal();
  }

  // --- ACADEMIC YEAR ---
  public setCurrentAcademicYear(year: string) {
    this.state.currentAcademicYear = year;
    this.saveLocal();
  }

  public addAcademicYear(year: string) {
    if (this.state.academicYears.some((ay) => ay.year === year)) return;
    const newAy: AcademicYear = { id: `ay-${Date.now()}`, year, isCurrent: false };
    this.state.academicYears.push(newAy);
    this.saveLocal();
  }

  // --- AUDIT LOG ---
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    // Persist to firestore asynchronously
    setDoc(doc(db, 'audit_logs', log.id), log).catch(() => {});
    this.saveLocal();
  }

  // --- STUDENTS ---
  public addStudent(student: Omit<Student, 'id' | 'createdDate'>, tempPassword?: string, actor?: { id: string; name: string; role: string }): Student {
    const id = `std-${Date.now()}`;
    const newStudent: Student = {
      ...student,
      id,
      createdDate: new Date().toISOString().split('T')[0],
    };

    const cleanAdmission = student.admissionNumber.trim();
    const defaultStudentPassword = `${cleanAdmission}${cleanAdmission}${cleanAdmission}`;

    // Also create corresponding user account for login with systematic credentials
    const user: User = {
      id: `user-${id}`,
      username: cleanAdmission,
      admissionNumber: cleanAdmission,
      role: 'student',
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      password: tempPassword || defaultStudentPassword,
      createdAt: new Date().toISOString(),
    };

    this.state.students.push(newStudent);
    this.state.users.push(user);

    setDoc(doc(db, 'students', id), newStudent).catch(() => {});
    setDoc(doc(db, 'users', user.id), user).catch(() => {});

    if (actor) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Added Student',
        entity: 'Student',
        entityId: id,
        details: `Created student ${student.name} (Ad.No: ${student.admissionNumber})`,
      });
    }

    this.saveLocal();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>, actor?: { id: string; name: string; role: string }) {
    const idx = this.state.students.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const prev = this.state.students[idx];
      this.state.students[idx] = { ...prev, ...updates };

      // Update associated user
      const userIdx = this.state.users.findIndex((u) => u.id === `user-${id}` || u.admissionNumber === prev.admissionNumber);
      if (userIdx !== -1) {
        this.state.users[userIdx] = {
          ...this.state.users[userIdx],
          name: updates.name || this.state.users[userIdx].name,
          email: updates.email !== undefined ? updates.email : this.state.users[userIdx].email,
          phone: updates.phone !== undefined ? updates.phone : this.state.users[userIdx].phone,
          status: updates.status || this.state.users[userIdx].status,
          admissionNumber: updates.admissionNumber || this.state.users[userIdx].admissionNumber,
        };
      }

      setDoc(doc(db, 'students', id), this.state.students[idx]).catch(() => {});

      if (actor) {
        this.addAuditLog({
          userId: actor.id,
          userName: actor.name,
          role: actor.role,
          action: 'Updated Student',
          entity: 'Student',
          entityId: id,
          details: `Updated details for ${this.state.students[idx].name}`,
        });
      }

      this.saveLocal();
    }
  }

  public deleteStudent(id: string, actor?: { id: string; name: string; role: string }) {
    const student = this.state.students.find((s) => s.id === id);
    this.state.students = this.state.students.filter((s) => s.id !== id);
    this.state.users = this.state.users.filter((u) => u.id !== `user-${id}` && u.admissionNumber !== student?.admissionNumber);
    // Also remove marks
    this.state.marks = this.state.marks.filter((m) => m.studentId !== id);

    deleteDoc(doc(db, 'students', id)).catch(() => {});

    if (actor && student) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Deleted Student',
        entity: 'Student',
        entityId: id,
        details: `Deleted student ${student.name} (Ad.No: ${student.admissionNumber})`,
      });
    }

    this.saveLocal();
  }

  // --- TEACHERS ---
  public addTeacher(teacher: Omit<Teacher, 'id' | 'createdDate'>, password?: string, actor?: { id: string; name: string; role: string }): Teacher {
    const id = `teacher-${Date.now()}`;
    const newTeacher: Teacher = {
      ...teacher,
      id,
      createdDate: new Date().toISOString().split('T')[0],
    };

    const user: User = {
      id: `user-${id}`,
      username: teacher.username,
      role: 'teacher',
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      status: teacher.status,
      password: password || 'teacher123',
      createdAt: new Date().toISOString(),
    };

    this.state.teachers.push(newTeacher);
    this.state.users.push(user);

    setDoc(doc(db, 'teachers', id), newTeacher).catch(() => {});
    setDoc(doc(db, 'users', user.id), user).catch(() => {});

    if (actor) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Added Teacher',
        entity: 'Teacher',
        entityId: id,
        details: `Created teacher ${teacher.name} (${teacher.email})`,
      });
    }

    this.saveLocal();
    return newTeacher;
  }

  public updateTeacher(
    id: string,
    updates: Partial<Teacher>,
    newPasswordOrActor?: string | { id: string; name: string; role: string },
    actor?: { id: string; name: string; role: string }
  ) {
    let newPassword: string | undefined;
    let actualActor = actor;
    if (typeof newPasswordOrActor === 'string') {
      newPassword = newPasswordOrActor;
    } else if (newPasswordOrActor && typeof newPasswordOrActor === 'object') {
      actualActor = newPasswordOrActor;
    }

    const idx = this.state.teachers.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const prev = this.state.teachers[idx];
      this.state.teachers[idx] = { ...prev, ...updates };

      const userIdx = this.state.users.findIndex(
        (u) => u.id === `user-${id}` || u.username === prev.username
      );
      if (userIdx !== -1) {
        this.state.users[userIdx] = {
          ...this.state.users[userIdx],
          name: updates.name || this.state.users[userIdx].name,
          username: updates.username || this.state.users[userIdx].username,
          email: updates.email !== undefined ? updates.email : this.state.users[userIdx].email,
          phone: updates.phone !== undefined ? updates.phone : this.state.users[userIdx].phone,
          status: updates.status || this.state.users[userIdx].status,
          password: newPassword ? newPassword : this.state.users[userIdx].password,
        };
        setDoc(doc(db, 'users', this.state.users[userIdx].id), this.state.users[userIdx]).catch(() => {});
      }

      setDoc(doc(db, 'teachers', id), this.state.teachers[idx]).catch(() => {});

      if (actualActor) {
        this.addAuditLog({
          userId: actualActor.id,
          userName: actualActor.name,
          role: actualActor.role,
          action: 'Updated Teacher',
          entity: 'Teacher',
          entityId: id,
          details: `Updated teacher profile for ${this.state.teachers[idx].name}${newPassword ? ' (including login credentials)' : ''}`,
        });
      }

      this.saveLocal();
    }
  }

  public getTeacherCredentials(teacherId: string): { username: string; password?: string } | null {
    const teacher = this.state.teachers.find((t) => t.id === teacherId);
    if (!teacher) return null;
    const user = this.state.users.find(
      (u) => u.id === `user-${teacherId}` || u.username === teacher.username || (teacher.email && u.email === teacher.email)
    );
    return {
      username: teacher.username,
      password: user?.password || 'teacher123',
    };
  }

  public deleteTeacher(id: string, actor?: { id: string; name: string; role: string }) {
    const teacher = this.state.teachers.find((t) => t.id === id);
    this.state.teachers = this.state.teachers.filter((t) => t.id !== id);
    this.state.users = this.state.users.filter((u) => u.id !== `user-${id}`);

    deleteDoc(doc(db, 'teachers', id)).catch(() => {});

    if (actor && teacher) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Deleted Teacher',
        entity: 'Teacher',
        entityId: id,
        details: `Deleted teacher ${teacher.name}`,
      });
    }

    this.saveLocal();
  }

  // --- CLASSES ---
  public addClass(classRoom: Omit<ClassRoom, 'id'>, actor?: { id: string; name: string; role: string }): ClassRoom {
    const id = `class-${Date.now()}`;
    const newClass: ClassRoom = {
      ...classRoom,
      id,
    };
    this.state.classes.push(newClass);
    setDoc(doc(db, 'classes', id), newClass).catch(() => {});

    if (actor) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Created Class',
        entity: 'Class',
        entityId: id,
        details: `Created class ${newClass.name} (${newClass.academicYear})`,
      });
    }

    this.saveLocal();
    return newClass;
  }

  public updateClass(id: string, updates: Partial<ClassRoom>, actor?: { id: string; name: string; role: string }) {
    const idx = this.state.classes.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.state.classes[idx] = { ...this.state.classes[idx], ...updates };
      setDoc(doc(db, 'classes', id), this.state.classes[idx]).catch(() => {});

      if (actor) {
        this.addAuditLog({
          userId: actor.id,
          userName: actor.name,
          role: actor.role,
          action: 'Updated Class',
          entity: 'Class',
          entityId: id,
          details: `Updated class ${this.state.classes[idx].name}`,
        });
      }

      this.saveLocal();
    }
  }

  public deleteClass(id: string, actor?: { id: string; name: string; role: string }) {
    const classRoom = this.state.classes.find((c) => c.id === id);
    this.state.classes = this.state.classes.filter((c) => c.id !== id);
    deleteDoc(doc(db, 'classes', id)).catch(() => {});

    if (actor && classRoom) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Deleted Class',
        entity: 'Class',
        entityId: id,
        details: `Deleted class ${classRoom.name}`,
      });
    }

    this.saveLocal();
  }

  // --- SUBJECTS ---
  public addSubject(subject: Omit<Subject, 'id'>, actor?: { id: string; name: string; role: string }): Subject {
    const id = `sub-${Date.now()}`;
    const newSubject: Subject = {
      ...subject,
      id,
    };
    this.state.subjects.push(newSubject);
    setDoc(doc(db, 'subjects', id), newSubject).catch(() => {});

    if (actor) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Created Subject',
        entity: 'Subject',
        entityId: id,
        details: `Created subject ${newSubject.name} (${newSubject.code})`,
      });
    }

    this.saveLocal();
    return newSubject;
  }

  public updateSubject(id: string, updates: Partial<Subject>, actor?: { id: string; name: string; role: string }) {
    const idx = this.state.subjects.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.state.subjects[idx] = { ...this.state.subjects[idx], ...updates };
      setDoc(doc(db, 'subjects', id), this.state.subjects[idx]).catch(() => {});

      if (actor) {
        this.addAuditLog({
          userId: actor.id,
          userName: actor.name,
          role: actor.role,
          action: 'Updated Subject',
          entity: 'Subject',
          entityId: id,
          details: `Updated subject ${this.state.subjects[idx].name}`,
        });
      }

      this.saveLocal();
    }
  }

  public deleteSubject(id: string, actor?: { id: string; name: string; role: string }) {
    const subject = this.state.subjects.find((s) => s.id === id);
    this.state.subjects = this.state.subjects.filter((s) => s.id !== id);
    this.state.evaluationLevels = this.state.evaluationLevels.filter((el) => el.subjectId !== id);
    this.state.marks = this.state.marks.filter((m) => m.subjectId !== id);

    deleteDoc(doc(db, 'subjects', id)).catch(() => {});

    if (actor && subject) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Deleted Subject',
        entity: 'Subject',
        entityId: id,
        details: `Deleted subject ${subject.name}`,
      });
    }

    this.saveLocal();
  }

  // --- EVALUATION LEVELS ---
  public addEvaluationLevel(level: Omit<EvaluationLevel, 'id'>, actor?: { id: string; name: string; role: string }): EvaluationLevel {
    const id = `eval-${Date.now()}`;
    const newLevel: EvaluationLevel = {
      ...level,
      id,
    };
    this.state.evaluationLevels.push(newLevel);
    setDoc(doc(db, 'evaluation_levels', id), newLevel).catch(() => {});

    if (actor) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Added Evaluation Level',
        entity: 'EvaluationLevel',
        entityId: id,
        details: `Added ${newLevel.name} (Max: ${newLevel.maximumMark}) to subject`,
      });
    }

    this.saveLocal();
    return newLevel;
  }

  public updateEvaluationLevel(id: string, updates: Partial<EvaluationLevel>, actor?: { id: string; name: string; role: string }) {
    const idx = this.state.evaluationLevels.findIndex((el) => el.id === id);
    if (idx !== -1) {
      const prev = this.state.evaluationLevels[idx];
      this.state.evaluationLevels[idx] = { ...prev, ...updates };

      // Update maximumMark in marks if changed
      if (updates.maximumMark !== undefined && updates.maximumMark !== prev.maximumMark) {
        this.state.marks = this.state.marks.map((m) => {
          if (m.evaluationLevelId === id) {
            return {
              ...m,
              maximumMark: updates.maximumMark!,
            };
          }
          return m;
        });
      }

      setDoc(doc(db, 'evaluation_levels', id), this.state.evaluationLevels[idx]).catch(() => {});

      if (actor) {
        this.addAuditLog({
          userId: actor.id,
          userName: actor.name,
          role: actor.role,
          action: 'Updated Evaluation Level',
          entity: 'EvaluationLevel',
          entityId: id,
          details: `Updated level ${prev.name} (Max: ${updates.maximumMark || prev.maximumMark})`,
        });
      }

      this.saveLocal();
    }
  }

  public deleteEvaluationLevel(id: string, actor?: { id: string; name: string; role: string }) {
    const level = this.state.evaluationLevels.find((el) => el.id === id);
    this.state.evaluationLevels = this.state.evaluationLevels.filter((el) => el.id !== id);
    this.state.marks = this.state.marks.filter((m) => m.evaluationLevelId !== id);

    deleteDoc(doc(db, 'evaluation_levels', id)).catch(() => {});

    if (actor && level) {
      this.addAuditLog({
        userId: actor.id,
        userName: actor.name,
        role: actor.role,
        action: 'Deleted Evaluation Level',
        entity: 'EvaluationLevel',
        entityId: id,
        details: `Deleted level ${level.name}`,
      });
    }

    this.saveLocal();
  }

  // --- MARKS ---
  public saveMarks(
    marksToSave: {
      studentId: string;
      classId: string;
      subjectId: string;
      evaluationLevelId: string;
      maximumMark: number;
      obtainedMark: number | null;
      date?: string;
    }[],
    actor: { id: string; name: string; role: string }
  ) {
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    marksToSave.forEach((m) => {
      const existingIdx = this.state.marks.findIndex(
        (existing) =>
          existing.studentId === m.studentId &&
          existing.subjectId === m.subjectId &&
          existing.evaluationLevelId === m.evaluationLevelId
      );

      if (existingIdx !== -1) {
        if (m.obtainedMark === null) {
          // If cleared
          this.state.marks[existingIdx] = {
            ...this.state.marks[existingIdx],
            obtainedMark: null,
            lastUpdated: now,
            enteredBy: actor.name,
          };
        } else {
          this.state.marks[existingIdx] = {
            ...this.state.marks[existingIdx],
            obtainedMark: m.obtainedMark,
            maximumMark: m.maximumMark,
            date: m.date || today,
            enteredBy: actor.name,
            lastUpdated: now,
          };
        }
        setDoc(doc(db, 'marks', this.state.marks[existingIdx].id), this.state.marks[existingIdx]).catch(() => {});
      } else if (m.obtainedMark !== null) {
        const id = `mark-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newMark: Mark = {
          id,
          studentId: m.studentId,
          classId: m.classId,
          subjectId: m.subjectId,
          evaluationLevelId: m.evaluationLevelId,
          maximumMark: m.maximumMark,
          obtainedMark: m.obtainedMark,
          date: m.date || today,
          enteredBy: actor.name,
          lastUpdated: now,
        };
        this.state.marks.push(newMark);
        setDoc(doc(db, 'marks', id), newMark).catch(() => {});
      }
    });

    this.addAuditLog({
      userId: actor.id,
      userName: actor.name,
      role: actor.role,
      action: 'Saved Marks',
      entity: 'Mark',
      entityId: marksToSave[0]?.subjectId || 'bulk',
      details: `Saved ${marksToSave.length} mark entries`,
    });

    this.saveLocal();
  }

  // --- PASSWORD UPDATE ---
  public changePassword(userId: string, newPass: string) {
    const user = this.state.users.find((u) => u.id === userId);
    if (user) {
      user.password = newPass;
      user.updatedAt = new Date().toISOString();
      setDoc(doc(db, 'users', userId), user).catch(() => {});
      this.saveLocal();
      return true;
    }
    return false;
  }

  // --- BULK IMPORT ---
  public bulkImportStudents(students: any[], actor?: { id: string; name: string; role: string }) {
    let imported = 0;
    const defaultActor = actor || { id: 'admin', name: 'Administrator', role: 'super_admin' };

    students.forEach((s) => {
      const targetClassName = String(s.className || '').trim();
      if (!targetClassName) return;

      // Find class ID by name (case-insensitive and whitespace-insensitive)
      let classRoom = this.state.classes.find(
        (c) =>
          c.name.trim().toLowerCase() === targetClassName.toLowerCase() ||
          c.name.replace(/\s+/g, '').toLowerCase() === targetClassName.replace(/\s+/g, '').toLowerCase()
      );

      // Auto-create class if it does not yet exist
      if (!classRoom) {
        classRoom = this.addClass({
          name: targetClassName,
          academicYear: this.state.currentAcademicYear || '2025-2026',
          status: 'active',
        }, defaultActor);
      }

      if (classRoom) {
        const cleanAdmission = String(s.admissionNumber || '').trim();
        if (!cleanAdmission) return;

        // Skip if student already exists with this admission number
        const existingStudent = this.state.students.find(
          (std) => std.admissionNumber.trim().toLowerCase() === cleanAdmission.toLowerCase()
        );

        if (!existingStudent) {
          this.addStudent({
            admissionNumber: cleanAdmission,
            name: String(s.name || '').trim(),
            classId: classRoom.id,
            phone: String(s.phone || '').trim(),
            email: String(s.email || '').trim(),
            username: String(s.username || cleanAdmission).trim(),
            status: 'active',
          }, s.password, defaultActor);
          imported++;
        }
      }
    });

    this.saveLocal();
    return imported;
  }

  public bulkImportTeachers(teachers: any[], actor?: { id: string; name: string; role: string }) {
    let imported = 0;
    const defaultActor = actor || { id: 'admin', name: 'Administrator', role: 'super_admin' };

    teachers.forEach((t) => {
      const name = String(t.name || '').trim();
      if (!name) return;

      // Map assigned class names to IDs if provided
      const assignedClassIds: string[] = [];
      if (Array.isArray(t.assignedClasses)) {
        t.assignedClasses.forEach((cName: string) => {
          const target = String(cName).trim();
          const c = this.state.classes.find(
            (cls) =>
              cls.name.trim().toLowerCase() === target.toLowerCase() ||
              cls.name.replace(/\s+/g, '').toLowerCase() === target.replace(/\s+/g, '').toLowerCase()
          );
          if (c) assignedClassIds.push(c.id);
        });
      }

      // Check if teacher already exists by username or email
      const username = String(t.username || t.email?.split('@')[0] || `teacher_${Date.now()}`).trim();
      const existing = this.state.teachers.find(
        (teach) =>
          teach.username.toLowerCase() === username.toLowerCase() ||
          (t.email && teach.email && teach.email.toLowerCase() === String(t.email).trim().toLowerCase())
      );

      if (!existing) {
        this.addTeacher({
          name,
          phone: String(t.phone || '').trim(),
          email: String(t.email || '').trim(),
          username,
          status: 'active',
          assignedSubjectIds: [],
          assignedClassIds,
          classTeacherOfClassIds: [],
        }, t.password, defaultActor);
        imported++;
      }
    });

    this.saveLocal();
    return imported;
  }

  public bulkImportClasses(classes: any[], actor?: { id: string; name: string; role: string }) {
    let imported = 0;
    const defaultActor = actor || { id: 'admin', name: 'Administrator', role: 'super_admin' };

    classes.forEach((c) => {
      const className = String(c.name || '').trim();
      if (!className) return;

      // Skip if class already exists
      const existing = this.state.classes.find(
        (cls) =>
          cls.name.trim().toLowerCase() === className.toLowerCase() ||
          cls.name.replace(/\s+/g, '').toLowerCase() === className.replace(/\s+/g, '').toLowerCase()
      );

      if (!existing) {
        let teacherId: string | undefined;
        if (c.classTeacher) {
          const teacherTarget = String(c.classTeacher).trim().toLowerCase();
          const teacher = this.state.teachers.find(
            (t) =>
              t.name.trim().toLowerCase() === teacherTarget ||
              t.email.trim().toLowerCase() === teacherTarget
          );
          if (teacher) teacherId = teacher.id;
        }

        this.addClass({
          name: className,
          academicYear: String(c.academicYear || this.state.currentAcademicYear || '2025-2026').trim(),
          classTeacherId: teacherId,
          status: 'active',
        }, defaultActor);
        imported++;
      }
    });

    this.saveLocal();
    return imported;
  }

  public bulkImportSubjects(subjects: any[], actor?: { id: string; name: string; role: string }) {
    let imported = 0;
    const defaultActor = actor || { id: 'admin', name: 'Administrator', role: 'super_admin' };

    subjects.forEach((s) => {
      const targetClassName = String(s.className || '').trim();
      const subjectName = String(s.name || '').trim();
      const code = String(s.code || '').trim();
      if (!subjectName || !code) return;

      // Find class or auto-create
      let classRoom = this.state.classes.find(
        (c) =>
          c.name.trim().toLowerCase() === targetClassName.toLowerCase() ||
          c.name.replace(/\s+/g, '').toLowerCase() === targetClassName.replace(/\s+/g, '').toLowerCase()
      );

      if (!classRoom && targetClassName) {
        classRoom = this.addClass({
          name: targetClassName,
          academicYear: this.state.currentAcademicYear || '2025-2026',
          status: 'active',
        }, defaultActor);
      }

      if (classRoom) {
        // Skip duplicate subject in same class
        const existing = this.state.subjects.find(
          (sub) =>
            sub.classId === classRoom!.id &&
            (sub.code.toLowerCase() === code.toLowerCase() || sub.name.toLowerCase() === subjectName.toLowerCase())
        );

        if (!existing) {
          let teacherId: string | undefined;
          if (s.assignedTeacher) {
            const teacherTarget = String(s.assignedTeacher).trim().toLowerCase();
            const teacher = this.state.teachers.find(
              (t) =>
                t.name.trim().toLowerCase() === teacherTarget ||
                t.email.trim().toLowerCase() === teacherTarget
            );
            if (teacher) teacherId = teacher.id;
          }

          this.addSubject({
            name: subjectName,
            code,
            classId: classRoom.id,
            assignedTeacherId: teacherId,
            status: 'active',
          }, defaultActor);
          imported++;
        }
      }
    });

    this.saveLocal();
    return imported;
  }

  // Alias methods for import
  public importStudents(students: any[], actor?: { id: string; name: string; role: string }) {
    return this.bulkImportStudents(students, actor);
  }

  public importTeachers(teachers: any[], actor?: { id: string; name: string; role: string }) {
    return this.bulkImportTeachers(teachers, actor);
  }

  public importClasses(classes: any[], actor?: { id: string; name: string; role: string }) {
    return this.bulkImportClasses(classes, actor);
  }

  public importSubjects(subjects: any[], actor?: { id: string; name: string; role: string }) {
    return this.bulkImportSubjects(subjects, actor);
  }

  public saveMarksBatch(
    subjectId: string,
    marks: { studentId: string; subjectId: string; evaluationLevelId: string; obtainedMark: number }[],
    actor?: { id: string; name: string; role: string }
  ): number {
    const defaultActor = actor || { id: 'admin', name: 'Administrator', role: 'super_admin' };
    const subject = this.state.subjects.find((s) => s.id === subjectId);
    const classId = subject?.classId || '';

    const payload = marks.map((m) => {
      const level = this.state.evaluationLevels.find((l) => l.id === m.evaluationLevelId);
      return {
        studentId: m.studentId,
        classId,
        subjectId: m.subjectId,
        evaluationLevelId: m.evaluationLevelId,
        maximumMark: level?.maximumMark ?? 100,
        obtainedMark: m.obtainedMark,
      };
    });

    this.saveMarks(payload, defaultActor);
    return marks.length;
  }

  // Reset to initial seed demo
  public resetToSeedDemo() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.saveLocal();
    this.initFirestoreSync();
  }
}

export const dataService = new DataService();
