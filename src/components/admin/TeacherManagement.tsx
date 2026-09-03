import React, { useState } from 'react';
import { dataService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import type { Teacher } from '../../types';
import {
  GraduationCap,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Badge } from '../common/Badge';

export const TeacherManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const state = dataService.getState();
  const [, setRerender] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [viewingCredentialsTeacher, setViewingCredentialsTeacher] = useState<Teacher | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [newQuickPassword, setNewQuickPassword] = useState('');
  const [quickPasswordMsg, setQuickPasswordMsg] = useState<string | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('teacher123');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formAssignedClassIds, setFormAssignedClassIds] = useState<string[]>([]);
  const [formAssignedSubjectIds, setFormAssignedSubjectIds] = useState<string[]>([]);
  const [formClassTeacherOfClassIds, setFormClassTeacherOfClassIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredTeachers = state.teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormUsername('');
    setFormPassword('teacher123');
    setFormStatus('active');
    setFormAssignedClassIds([]);
    setFormAssignedSubjectIds([]);
    setFormClassTeacherOfClassIds([]);
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormName(teacher.name);
    setFormPhone(teacher.phone);
    setFormEmail(teacher.email);
    setFormUsername(teacher.username);
    const creds = dataService.getTeacherCredentials(teacher.id);
    setFormPassword(creds?.password || '');
    setFormStatus(teacher.status);
    setFormAssignedClassIds(teacher.assignedClassIds || []);
    setFormAssignedSubjectIds(teacher.assignedSubjectIds || []);
    setFormClassTeacherOfClassIds(teacher.classTeacherOfClassIds || []);
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formName.trim();
    const cleanEmail = formEmail.trim();
    const cleanUsername = formUsername.trim() || cleanEmail.split('@')[0];

    if (!cleanName || !cleanEmail || !cleanUsername) {
      setFormError('Full name, email, and username are required.');
      return;
    }

    // Check unique username
    const duplicateUsername = state.teachers.find(
      (t) =>
        t.username.toLowerCase() === cleanUsername.toLowerCase() &&
        t.id !== editingTeacher?.id
    );
    if (duplicateUsername) {
      setFormError(`Username "${cleanUsername}" is already used by ${duplicateUsername.name}.`);
      return;
    }

    const actor = currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : undefined;

    if (editingTeacher) {
      dataService.updateTeacher(
        editingTeacher.id,
        {
          name: cleanName,
          phone: formPhone.trim(),
          email: cleanEmail,
          username: cleanUsername,
          status: formStatus,
          assignedClassIds: formAssignedClassIds,
          assignedSubjectIds: formAssignedSubjectIds,
          classTeacherOfClassIds: formClassTeacherOfClassIds,
        },
        formPassword.trim() ? formPassword.trim() : undefined,
        actor
      );

      // Also update classes classTeacherId
      state.classes.forEach((c) => {
        if (formClassTeacherOfClassIds.includes(c.id)) {
          dataService.updateClass(c.id, { classTeacherId: editingTeacher.id }, actor);
        } else if (c.classTeacherId === editingTeacher.id) {
          dataService.updateClass(c.id, { classTeacherId: undefined }, actor);
        }
      });
    } else {
      const createdTeacher = dataService.addTeacher(
        {
          name: cleanName,
          phone: formPhone.trim(),
          email: cleanEmail,
          username: cleanUsername,
          status: formStatus,
          assignedClassIds: formAssignedClassIds,
          assignedSubjectIds: formAssignedSubjectIds,
          classTeacherOfClassIds: formClassTeacherOfClassIds,
        },
        formPassword || 'teacher123',
        actor
      );

      // Update class teacher assignment on class entities
      formClassTeacherOfClassIds.forEach((classId) => {
        dataService.updateClass(classId, { classTeacherId: createdTeacher.id }, actor);
      });
    }

    setIsAddEditModalOpen(false);
    setRerender((v) => v + 1);
  };

  const handleDeleteConfirm = () => {
    if (!deletingTeacher) return;
    const actor = currentUser
      ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      : undefined;

    dataService.deleteTeacher(deletingTeacher.id, actor);
    setDeletingTeacher(null);
    setRerender((v) => v + 1);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            Teacher Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage teaching faculty, subject allocations, and Class Teacher appointments
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search teachers by name, email, username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span>Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
          >
            <option value="ALL">All Status ({state.teachers.length})</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Teacher Listing Table strictly matching Section 5 */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">SI. No</th>
                <th className="py-3.5 px-4">Teacher</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Subjects</th>
                <th className="py-3.5 px-4">Class Teacher Of</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No teachers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, idx) => {
                  const assignedSubs = state.subjects.filter(
                    (s) =>
                      s.assignedTeacherId === teacher.id ||
                      teacher.assignedSubjectIds?.includes(s.id)
                  );
                  const classTeacherClasses = state.classes.filter(
                    (c) =>
                      c.classTeacherId === teacher.id ||
                      teacher.classTeacherOfClassIds?.includes(c.id)
                  );

                  return (
                    <tr
                      key={teacher.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {teacher.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          @{teacher.username} • {teacher.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                        {teacher.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {assignedSubs.length === 0 ? (
                            <span className="text-xs text-slate-400">No subjects assigned</span>
                          ) : (
                            assignedSubs.map((sub) => {
                              const cls = state.classes.find((c) => c.id === sub.classId);
                              return (
                                <span
                                  key={sub.id}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                >
                                  {sub.name} {cls ? `(${cls.name})` : ''}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {classTeacherClasses.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {classTeacherClasses.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium"
                              >
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={teacher.status === 'active' ? 'success' : 'neutral'}>
                          {teacher.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setViewingCredentialsTeacher(teacher);
                              const creds = dataService.getTeacherCredentials(teacher.id);
                              setNewQuickPassword(creds?.password || 'teacher123');
                              setQuickPasswordMsg(null);
                              setCopiedCredentials(false);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                            title="Teacher Login Credentials"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewingTeacher(teacher)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                            title="View Teacher Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(teacher)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition"
                            title="Edit Teacher"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTeacher(teacher)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Delete Teacher"
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
      </div>

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={editingTeacher ? `Edit Teacher: ${editingTeacher.name}` : 'Add New Teacher'}
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
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ms. Sarah Connor"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Class Teacher Responsibility Assignment */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
            <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Class Teacher Assignment (Optional)
            </label>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2">
              Class Teachers receive read-only oversight to view all subject marks for their assigned class.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {state.classes.map((cls) => {
                const isAssigned = formClassTeacherOfClassIds.includes(cls.id);
                return (
                  <label
                    key={cls.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormClassTeacherOfClassIds([...formClassTeacherOfClassIds, cls.id]);
                        } else {
                          setFormClassTeacherOfClassIds(
                            formClassTeacherOfClassIds.filter((id) => id !== cls.id)
                          );
                        }
                      }}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {cls.name} ({cls.academicYear})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Login Username
              </label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="e.g. robert.vance"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {editingTeacher ? 'Reset Password (Leave blank to keep)' : 'Temporary Password'}
              </label>
              <input
                type="text"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="teacher123"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 font-mono"
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
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
            >
              {editingTeacher ? 'Save Changes' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Teacher Details Modal */}
      {viewingTeacher && (
        <Modal
          isOpen={true}
          onClose={() => setViewingTeacher(null)}
          title={`Teacher Profile: ${viewingTeacher.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Teacher ID</span>
                <div className="text-sm font-mono font-bold text-purple-600">
                  {viewingTeacher.id}
                </div>
              </div>
              <Badge variant={viewingTeacher.status === 'active' ? 'success' : 'neutral'}>
                {viewingTeacher.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Full Name</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingTeacher.name}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Login Username</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  @{viewingTeacher.username}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Email Address</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingTeacher.email}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Phone</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewingTeacher.phone || '—'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-400 block mb-1">Class Teacher Responsibility:</span>
              {state.classes.filter(
                (c) =>
                  c.classTeacherId === viewingTeacher.id ||
                  viewingTeacher.classTeacherOfClassIds?.includes(c.id)
              ).length === 0 ? (
                <p className="text-xs text-slate-500">Not assigned as Class Teacher for any class.</p>
              ) : (
                <div className="flex gap-1.5 flex-wrap">
                  {state.classes
                    .filter(
                      (c) =>
                        c.classTeacherId === viewingTeacher.id ||
                        viewingTeacher.classTeacherOfClassIds?.includes(c.id)
                    )
                    .map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-1 rounded bg-amber-50 text-amber-800 text-xs font-semibold flex items-center gap-1 border border-amber-200"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        {c.name} ({c.academicYear})
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingTeacher(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Teacher Credentials Modal */}
      {viewingCredentialsTeacher && (
        <Modal
          isOpen={true}
          onClose={() => setViewingCredentialsTeacher(null)}
          title={`Login Credentials: ${viewingCredentialsTeacher.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  Super Admin Credential Authority
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  Teachers log in using the credentials managed here. You can copy these details or set a new password.
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Portal Login URL / Role
                </label>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  CCE Portal &gt; Teacher Tab
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Assigned Username
                </label>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{viewingCredentialsTeacher.username}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">
                    Email: {viewingCredentialsTeacher.email}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Current Password / Update Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuickPassword}
                    onChange={(e) => setNewQuickPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newQuickPassword.trim()) return;
                      const actor = currentUser
                        ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
                        : undefined;
                      dataService.updateTeacher(
                        viewingCredentialsTeacher.id,
                        {},
                        newQuickPassword.trim(),
                        actor
                      );
                      setQuickPasswordMsg('Password updated successfully!');
                      setTimeout(() => setQuickPasswordMsg(null), 3000);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shrink-0"
                  >
                    Save Password
                  </button>
                </div>
                {quickPasswordMsg && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-medium">{quickPasswordMsg}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const text = `Portal: CCE Evaluation Portal (Teacher Tab)\nUsername: ${viewingCredentialsTeacher.username}\nPassword: ${newQuickPassword}\nEmail: ${viewingCredentialsTeacher.email}`;
                  navigator.clipboard.writeText(text);
                  setCopiedCredentials(true);
                  setTimeout(() => setCopiedCredentials(false), 2500);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition"
              >
                {copiedCredentials ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Login Credentials</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewingCredentialsTeacher(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingTeacher && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingTeacher(null)}
          onConfirm={handleDeleteConfirm}
          title={`Delete Teacher: ${deletingTeacher.name}`}
          message={`Are you sure you want to remove ${deletingTeacher.name}?\n\nTheir login credentials will be revoked and subject assignments unlinked.`}
          confirmText="Yes, Delete Teacher"
          isDestructive={true}
        />
      )}
    </div>
  );
};
