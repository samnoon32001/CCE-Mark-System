import React, { useState } from 'react';
import { dataService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import type { Student } from '../../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';

export const StudentManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const state = dataService.getState();
  const [, setRerender] = useState(0);

  // Search, Filter, Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form inputs
  const [formAdmissionNumber, setFormAdmissionNumber] = useState('');
  const [formName, setFormName] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('student123');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState<string | null>(null);

  // Filter students
  const filteredStudents = state.students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;

    const matchesStatus =
      selectedStatusFilter === 'ALL' || s.status === selectedStatusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openAddModal = () => {
    setEditingStudent(null);
    setFormAdmissionNumber('');
    setFormName('');
    setFormClassId(state.classes[0]?.id || '');
    setFormPhone('');
    setFormEmail('');
    setFormUsername('');
    setFormPassword('');
    setFormStatus('active');
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormAdmissionNumber(student.admissionNumber);
    setFormName(student.name);
    setFormClassId(student.classId);
    setFormPhone(student.phone || '');
    setFormEmail(student.email || '');
    setFormUsername(student.username || student.admissionNumber);
    setFormPassword('');
    setFormStatus(student.status);
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanAdmission = formAdmissionNumber.trim();
    const cleanName = formName.trim();
    const cleanUsername = formUsername.trim() || cleanAdmission;

    if (!cleanAdmission || !cleanName || !formClassId) {
      setFormError('Admission number, full name, and class are required.');
      return;
    }

    // Check unique admission number
    const duplicateAdmission = state.students.find(
      (s) =>
        s.admissionNumber.toLowerCase() === cleanAdmission.toLowerCase() &&
        s.id !== editingStudent?.id
    );
    if (duplicateAdmission) {
      setFormError(`Admission number "${cleanAdmission}" is already in use by ${duplicateAdmission.name}.`);
      return;
    }

    // Check unique username
    const duplicateUser = state.users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername.toLowerCase() &&
        u.admissionNumber !== editingStudent?.admissionNumber &&
        u.id !== `user-${editingStudent?.id}`
    );
    if (duplicateUser) {
      setFormError(`Username "${cleanUsername}" is already taken.`);
      return;
    }

    const actor = currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : undefined;

    const defaultStudentPassword = `${cleanAdmission}${cleanAdmission}${cleanAdmission}`;

    if (editingStudent) {
      dataService.updateStudent(
        editingStudent.id,
        {
          admissionNumber: cleanAdmission,
          name: cleanName,
          classId: formClassId,
          phone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
          username: cleanUsername,
          status: formStatus,
        },
        actor
      );

      // If a custom password was provided, update user password
      if (formPassword.trim()) {
        const user = state.users.find(
          (u) => u.id === `user-${editingStudent.id}` || u.admissionNumber === editingStudent.admissionNumber
        );
        if (user) {
          user.password = formPassword.trim();
          user.username = cleanUsername;
        }
      }
    } else {
      dataService.addStudent(
        {
          admissionNumber: cleanAdmission,
          name: cleanName,
          classId: formClassId,
          phone: formPhone.trim() || undefined,
          email: formEmail.trim() || undefined,
          username: cleanUsername,
          status: formStatus,
        },
        formPassword.trim() || defaultStudentPassword,
        actor
      );
    }

    setIsAddEditModalOpen(false);
    setRerender((v) => v + 1);
  };

  const handleDeleteConfirm = () => {
    if (!deletingStudent) return;
    const actor = currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : undefined;

    dataService.deleteStudent(deletingStudent.id, actor);
    setDeletingStudent(null);
    setRerender((v) => v + 1);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Student Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View, enroll, and manage student admission records and class assignments
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by admission no, name, username..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span>Class:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => {
                setSelectedClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
            >
              <option value="ALL">All Classes ({state.students.length})</option>
              {state.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({state.students.filter((s) => s.classId === c.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span>Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Listing Table strictly matching Section 4 */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">SI. No</th>
                <th className="py-3.5 px-4">Admission No</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No students found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std, idx) => {
                  const siNo = (currentPage - 1) * pageSize + idx + 1;
                  const classRoom = state.classes.find((c) => c.id === std.classId);

                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                        {siNo}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {std.admissionNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          {std.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          @{std.username} {std.email ? `• ${std.email}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {classRoom ? classRoom.name : 'Unassigned'}
                        </span>
                        {classRoom && (
                          <span className="ml-1.5 text-[11px] text-slate-400">
                            ({classRoom.academicYear})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={std.status === 'active' ? 'success' : 'neutral'}>
                          {std.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingStudent(std)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                            title="View Student"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(std)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(std)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Delete / Deactivate Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
            </div>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded-lg border ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.name}` : 'Add New Student'}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg text-xs bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Admission Number *
              </label>
              <input
                type="text"
                required
                value={formAdmissionNumber}
                onChange={(e) => setFormAdmissionNumber(e.target.value)}
                placeholder="e.g. 1007"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Daniel Martinez"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assign Class *
              </label>
              <select
                required
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                {state.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.academicYear})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="student@school.edu"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone (Optional)
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(555) 111-0000"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-0.5">
              Systematic Student Login Rule:
            </span>
            <span className="text-emerald-700 dark:text-emerald-300">
              Username is <strong>Admission Number</strong>. Password defaults to <strong>Admission Number repeated 3 times</strong> (e.g. {formAdmissionNumber ? `${formAdmissionNumber}${formAdmissionNumber}${formAdmissionNumber}` : '100110011001'}).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Login Username (Defaults to Admission No)
              </label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder={formAdmissionNumber ? formAdmissionNumber : 'e.g. 1001'}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {editingStudent ? 'Override Password (Leave blank to keep)' : 'Custom Password (Optional)'}
              </label>
              <input
                type="text"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={formAdmissionNumber ? `${formAdmissionNumber}${formAdmissionNumber}${formAdmissionNumber}` : 'e.g. 100110011001'}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              {editingStudent ? 'Save Changes' : 'Create Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Student Details Modal */}
      {viewingStudent && (
        <Modal
          isOpen={true}
          onClose={() => setViewingStudent(null)}
          title={`Student Profile: ${viewingStudent.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <span className="text-xs text-slate-400">Admission No</span>
                <div className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                  {viewingStudent.admissionNumber}
                </div>
              </div>
              <Badge variant={viewingStudent.status === 'active' ? 'success' : 'neutral'}>
                {viewingStudent.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Full Name</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingStudent.name}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Class</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {state.classes.find((c) => c.id === viewingStudent.classId)?.name || 'Unassigned'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Login Username</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  @{viewingStudent.username}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Enrolled Date</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingStudent.createdDate}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Email</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingStudent.email || '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Phone</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingStudent.phone || '—'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingStudent && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingStudent(null)}
          onConfirm={handleDeleteConfirm}
          title={`Delete Student: ${deletingStudent.name}`}
          message={`Are you sure you want to remove ${deletingStudent.name} (Ad.No: ${deletingStudent.admissionNumber})?\n\nThis will remove their student record and all entered evaluation marks.`}
          confirmText="Yes, Delete Student"
          isDestructive={true}
        />
      )}
    </div>
  );
};
