import * as XLSX from 'xlsx';

export interface SubjectExportRow {
  siNo: number;
  admissionNo: string;
  name: string;
  mark: string; // Formatted 2 decimal weighted mark out of 30
}

/**
 * Generates and downloads the Subject Excel export
 * Headers must be EXACTLY:
 * SI. No | Ad.No | Name | Mark
 * Mark is the final weighted mark out of 30!
 */
export function exportSubjectMarksExcel(
  className: string,
  subjectName: string,
  rows: SubjectExportRow[]
) {
  // Exact 4 headers as strictly mandated: SI. No, Ad.No, Name, Mark
  const exportData = rows.map((r) => ({
    'SI. No': r.siNo,
    'Ad.No': r.admissionNo,
    Name: r.name,
    Mark: r.mark,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Auto column widths
  worksheet['!cols'] = [
    { wch: 8 },  // SI. No
    { wch: 14 }, // Ad.No
    { wch: 25 }, // Name
    { wch: 12 }, // Mark
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Marks');

  // Sanitize filename: Class_8A_English_Marks.xlsx
  const safeClass = className.replace(/[^a-zA-Z0-9]/g, '');
  const safeSubject = subjectName.replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `Class_${safeClass}_${safeSubject}_Marks.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

/**
 * Downloads Excel templates for data import
 */
export function downloadExcelTemplate(type: 'students' | 'teachers' | 'classes' | 'subjects') {
  const workbook = XLSX.utils.book_new();
  let sheetData: Record<string, any>[] = [];
  let fileName = '';

  switch (type) {
    case 'students':
      sheetData = [
        {
          'Admission Number': '1007',
          'Full Name': 'David Miller',
          'Class Name': 'Class 8 A',
          'Phone': '9876543210',
          'Email': 'david.m@school.edu',
          'Username': 'david1007',
          'Password': 'student123',
        },
        {
          'Admission Number': '1008',
          'Full Name': 'Emma Watson',
          'Class Name': 'Class 8 A',
          'Phone': '9876543211',
          'Email': 'emma.w@school.edu',
          'Username': 'emma1008',
          'Password': 'student123',
        },
      ];
      fileName = 'Template_Students_Import.xlsx';
      break;

    case 'teachers':
      sheetData = [
        {
          'Full Name': 'Mr. Michael Chang',
          'Phone': '9123456780',
          'Email': 'm.chang@school.edu',
          'Username': 'mchang',
          'Password': 'teacher123',
          'Assigned Classes': 'Class 8 A, Class 10 A',
          'Assigned Subjects': 'Mathematics',
          'Class Teacher Of': '',
        },
      ];
      fileName = 'Template_Teachers_Import.xlsx';
      break;

    case 'classes':
      sheetData = [
        {
          'Class Name': 'Class 9 A',
          'Academic Year': '2025-2026',
          'Class Teacher': 'Mr. Robert Vance',
        },
        {
          'Class Name': 'Class 9 B',
          'Academic Year': '2025-2026',
          'Class Teacher': '',
        },
      ];
      fileName = 'Template_Classes_Import.xlsx';
      break;

    case 'subjects':
      sheetData = [
        {
          'Subject Name': 'Computer Science',
          'Subject Code': 'CS101',
          'Class Name': 'Class 8 A',
          'Assigned Teacher': 'Dr. Albert Stone',
        },
        {
          'Subject Name': 'Physical Education',
          'Subject Code': 'PE101',
          'Class Name': 'Class 8 A',
          'Assigned Teacher': '',
        },
      ];
      fileName = 'Template_Subjects_Import.xlsx';
      break;
  }

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, fileName);
}

export interface ValidationResult<T = any> {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  validRows: T[];
  invalidRows: { rowNumber: number; reason: string; data: any }[];
}

/**
 * Parses and validates an uploaded Excel or CSV file
 */
export async function parseAndValidateExcel(
  file: File,
  type: 'students' | 'teachers' | 'classes' | 'subjects',
  existingContext: {
    admissionNumbers: Set<string>;
    usernames: Set<string>;
    classNames: Set<string>;
  }
): Promise<ValidationResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const validRows: any[] = [];
  const invalidRows: { rowNumber: number; reason: string; data: any }[] = [];
  const seenInBatchAdmissions = new Set<string>();
  const seenInBatchUsernames = new Set<string>();

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // +1 for 0-index, +1 for header row
    const errors: string[] = [];

    if (type === 'students') {
      const admissionNumber = String(row['Admission Number'] || '').trim();
      const fullName = String(row['Full Name'] || '').trim();
      const className = String(row['Class Name'] || '').trim();
      const username = String(row['Username'] || '').trim();

      if (!admissionNumber) errors.push('Admission Number is required');
      if (!fullName) errors.push('Full Name is required');
      if (!className) errors.push('Class Name is required');

      if (admissionNumber) {
        if (existingContext.admissionNumbers.has(admissionNumber)) {
          errors.push(`Admission number "${admissionNumber}" already exists in system`);
        } else if (seenInBatchAdmissions.has(admissionNumber)) {
          errors.push(`Duplicate Admission number "${admissionNumber}" within uploaded file`);
        } else {
          seenInBatchAdmissions.add(admissionNumber);
        }
      }

      if (username) {
        if (existingContext.usernames.has(username)) {
          errors.push(`Username "${username}" already taken`);
        } else if (seenInBatchUsernames.has(username)) {
          errors.push(`Duplicate Username "${username}" within uploaded file`);
        } else {
          seenInBatchUsernames.add(username);
        }
      }

      if (className && !existingContext.classNames.has(className)) {
        errors.push(`Class "${className}" does not exist in the system. Create class first.`);
      }

      if (errors.length > 0) {
        invalidRows.push({ rowNumber: rowNum, reason: errors.join('; '), data: row });
      } else {
        validRows.push({
          admissionNumber,
          name: fullName,
          className,
          phone: String(row['Phone'] || '').trim(),
          email: String(row['Email'] || '').trim(),
          username: username || `std_${admissionNumber}`,
          password: String(row['Password'] || 'student123').trim(),
        });
      }
    } else if (type === 'teachers') {
      const fullName = String(row['Full Name'] || '').trim();
      const email = String(row['Email'] || '').trim();
      const username = String(row['Username'] || '').trim();

      if (!fullName) errors.push('Teacher Name is required');
      if (!username) errors.push('Username is required');

      if (username) {
        if (existingContext.usernames.has(username)) {
          errors.push(`Username "${username}" already exists`);
        } else if (seenInBatchUsernames.has(username)) {
          errors.push(`Duplicate Username "${username}" in file`);
        } else {
          seenInBatchUsernames.add(username);
        }
      }

      if (errors.length > 0) {
        invalidRows.push({ rowNumber: rowNum, reason: errors.join('; '), data: row });
      } else {
        validRows.push({
          name: fullName,
          phone: String(row['Phone'] || '').trim(),
          email,
          username,
          password: String(row['Password'] || 'teacher123').trim(),
          assignedClasses: String(row['Assigned Classes'] || '').split(',').map((s) => s.trim()).filter(Boolean),
          assignedSubjects: String(row['Assigned Subjects'] || '').split(',').map((s) => s.trim()).filter(Boolean),
        });
      }
    } else if (type === 'classes') {
      const className = String(row['Class Name'] || '').trim();
      const academicYear = String(row['Academic Year'] || '').trim();

      if (!className) errors.push('Class Name is required');
      if (!academicYear) errors.push('Academic Year is required');

      if (errors.length > 0) {
        invalidRows.push({ rowNumber: rowNum, reason: errors.join('; '), data: row });
      } else {
        validRows.push({
          name: className,
          academicYear,
          classTeacher: String(row['Class Teacher'] || '').trim(),
        });
      }
    } else if (type === 'subjects') {
      const subjectName = String(row['Subject Name'] || '').trim();
      const subjectCode = String(row['Subject Code'] || '').trim();
      const className = String(row['Class Name'] || '').trim();

      if (!subjectName) errors.push('Subject Name is required');
      if (!subjectCode) errors.push('Subject Code is required');
      if (!className) errors.push('Class Name is required');

      if (errors.length > 0) {
        invalidRows.push({ rowNumber: rowNum, reason: errors.join('; '), data: row });
      } else {
        validRows.push({
          name: subjectName,
          code: subjectCode,
          className,
          assignedTeacher: String(row['Assigned Teacher'] || '').trim(),
        });
      }
    }
  });

  return {
    totalRows: rawRows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows,
  };
}

/**
 * Generic Excel export helper
 */
export function exportToExcel(
  data: Record<string, any>[],
  fileName: string = 'Export.xlsx',
  sheetName: string = 'Data'
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

/**
 * Subject Final Marks Export (SI. No | Ad.No | Name | Mark)
 */
export function exportSubjectFinalMarksExcel(
  rows: any[],
  fileName: string = 'Subject_CCE_Marks.xlsx',
  sheetName: string = 'Subject Marks'
) {
  exportToExcel(rows, fileName, sheetName);
}

/**
 * Subject Full Breakdown Export
 */
export function exportSubjectFullBreakdownExcel(
  rows: any[],
  fileName: string = 'Subject_CCE_Full_Breakdown.xlsx',
  sheetName: string = 'CCE Breakdown'
) {
  exportToExcel(rows, fileName, sheetName);
}

/**
 * Asynchronously parse any Excel file into JSON rows
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
}

export function generateStudentTemplate() {
  downloadExcelTemplate('students');
}

export function generateTeacherTemplate() {
  downloadExcelTemplate('teachers');
}

export function generateClassTemplate() {
  downloadExcelTemplate('classes');
}

export function generateSubjectTemplate() {
  downloadExcelTemplate('subjects');
}

export function validateStudentRows(rows: any[], existingContext: any) {
  const validRows: any[] = [];
  const invalidRows: { rowNumber: number; reason: string; data: any }[] = [];
  const seenAdmissions = new Set<string>();
  const seenUsernames = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const errors: string[] = [];
    const admissionNumber = String(row['Admission Number'] || row['Admission No'] || row['Ad.No'] || '').trim();
    const name = String(row['Full Name'] || row['Name'] || '').trim();
    const className = String(row['Class Name'] || row['Class'] || '').trim();
    const username = String(row['Username'] || '').trim();

    if (!admissionNumber) errors.push('Admission Number is required');
    if (!name) errors.push('Student Name is required');
    if (!className) errors.push('Class Name is required');

    if (admissionNumber) {
      if (existingContext.admissionNumbers?.has(admissionNumber)) {
        errors.push(`Admission number "${admissionNumber}" already exists in system`);
      } else if (seenAdmissions.has(admissionNumber)) {
        errors.push(`Duplicate admission number "${admissionNumber}" in file`);
      } else {
        seenAdmissions.add(admissionNumber);
      }
    }

    if (username) {
      if (existingContext.usernames?.has(username)) {
        errors.push(`Username "${username}" already taken`);
      } else if (seenUsernames.has(username)) {
        errors.push(`Duplicate username "${username}" in file`);
      } else {
        seenUsernames.add(username);
      }
    }

    if (className && existingContext.classNames && !existingContext.classNames.has(className)) {
      errors.push(`Class "${className}" does not exist in system`);
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNumber: rowNum, reason: errors.join('; '), data: row });
    } else {
      validRows.push({
        admissionNumber,
        name,
        className,
        phone: String(row['Phone'] || '').trim(),
        email: String(row['Email'] || '').trim(),
        username: username || `std_${admissionNumber}`,
        password: String(row['Password'] || 'student123').trim(),
      });
    }
  });

  return {
    totalRows: rows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows,
  };
}

export function validateTeacherRows(rows: any[], existingContext: any) {
  const validRows: any[] = [];
  const invalidRows: { rowNumber: number; reason: string; data: any }[] = [];
  const seenUsernames = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const errors: string[] = [];
    const name = String(row['Full Name'] || row['Name'] || '').trim();
    const username = String(row['Username'] || '').trim();

    if (!name) errors.push('Teacher Name is required');
    if (!username) errors.push('Username is required');

    if (username) {
      if (existingContext.usernames?.has(username)) {
        errors.push(`Username "${username}" already exists`);
      } else if (seenUsernames.has(username)) {
        errors.push(`Duplicate username "${username}" in file`);
      } else {
        seenUsernames.add(username);
      }
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNumber: rowNum, reason: errors.join('; '), data: row });
    } else {
      validRows.push({
        name,
        phone: String(row['Phone'] || '').trim(),
        email: String(row['Email'] || '').trim(),
        username,
        password: String(row['Password'] || 'teacher123').trim(),
        assignedClasses: String(row['Assigned Classes'] || '').split(',').map((s) => s.trim()).filter(Boolean),
        assignedSubjects: String(row['Assigned Subjects'] || '').split(',').map((s) => s.trim()).filter(Boolean),
      });
    }
  });

  return {
    totalRows: rows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows,
  };
}

export function validateClassRows(rows: any[], existingContext: any) {
  const validRows: any[] = [];
  const invalidRows: { rowNumber: number; reason: string; data: any }[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const errors: string[] = [];
    const name = String(row['Class Name'] || row['Name'] || '').trim();
    const academicYear = String(row['Academic Year'] || '').trim();

    if (!name) errors.push('Class Name is required');
    if (!academicYear) errors.push('Academic Year is required');

    if (errors.length > 0) {
      invalidRows.push({ rowNumber: rowNum, reason: errors.join('; '), data: row });
    } else {
      validRows.push({
        name,
        academicYear,
        classTeacher: String(row['Class Teacher'] || '').trim(),
      });
    }
  });

  return {
    totalRows: rows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows,
  };
}

export function validateSubjectRows(rows: any[], existingContext: any) {
  const validRows: any[] = [];
  const invalidRows: { rowNumber: number; reason: string; data: any }[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const errors: string[] = [];
    const name = String(row['Subject Name'] || row['Name'] || '').trim();
    const code = String(row['Subject Code'] || row['Code'] || '').trim();
    const className = String(row['Class Name'] || row['Class'] || '').trim();

    if (!name) errors.push('Subject Name is required');
    if (!code) errors.push('Subject Code is required');
    if (!className) errors.push('Class Name is required');

    if (errors.length > 0) {
      invalidRows.push({ rowNumber: rowNum, reason: errors.join('; '), data: row });
    } else {
      validRows.push({
        name,
        code,
        className,
        assignedTeacher: String(row['Assigned Teacher'] || '').trim(),
      });
    }
  });

  return {
    totalRows: rows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows,
  };
}
