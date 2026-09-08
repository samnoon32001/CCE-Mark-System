import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  X,
  AlertCircle,
  BookOpen,
  User,
  Coffee,
  Split,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/db';
import { TimetablePeriodDefinition, TimetableSlot, DayOfWeek, Subject, Teacher } from '../../types';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const TimetableManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const user = currentUser;
  const isSuperAdmin = user?.role === 'super_admin';
  const canEditTimetable = isSuperAdmin;

  const [dbState, setDbState] = useState(() => dataService.getState());
  const [activeTab, setActiveTab] = useState<'weekly-grid' | 'period-timings'>('weekly-grid');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    () => dbState.classes?.[0]?.id || 'class-8a'
  );
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');

  // Edit slot modal/drawer
  const [editingSlot, setEditingSlot] = useState<{
    periodNumber: number;
    dayOfWeek: DayOfWeek;
    classId: string;
    existingSlot?: TimetableSlot;
    subjectId: string;
    teacherId: string;
    room: string;
    isSplitSlot: boolean;
    secondarySubjectId?: string;
    secondaryTeacherId?: string;
  } | null>(null);

  // Edit period definition modal
  const [editingPeriod, setEditingPeriod] = useState<Partial<TimetablePeriodDefinition> | null>(null);

  React.useEffect(() => {
    return dataService.subscribe(() => {
      setDbState(dataService.getState());
    });
  }, []);

  const classes = dbState.classes || [];
  const subjects = dbState.subjects || [];
  const teachers = dbState.teachers || [];
  const periods = useMemo(() => {
    return (dbState.timetablePeriods || []).slice().sort((a, b) => a.periodNumber - b.periodNumber);
  }, [dbState.timetablePeriods]);

  const slots = dbState.timetableSlots || [];

  const classSubjects = useMemo(() => {
    return subjects.filter((s) => s.classId === selectedClassId && s.status !== 'inactive');
  }, [subjects, selectedClassId]);

  // Slots for current class and current day
  const currentDaySlots = useMemo(() => {
    return slots.filter(
      (s) => s.classId === selectedClassId && s.dayOfWeek.toLowerCase() === selectedDay.toLowerCase()
    );
  }, [slots, selectedClassId, selectedDay]);

  const handleOpenEditSlot = (period: TimetablePeriodDefinition) => {
    if (!canEditTimetable) return;

    // Find any existing slots for this period
    const existing = currentDaySlots.filter((s) => s.periodNumber === period.periodNumber);
    const primary = existing[0];
    const secondary = existing[1];

    setEditingSlot({
      periodNumber: period.periodNumber,
      dayOfWeek: selectedDay,
      classId: selectedClassId,
      existingSlot: primary,
      subjectId: primary?.subjectId || classSubjects[0]?.id || '',
      teacherId: primary?.teacherId || classSubjects[0]?.assignedTeacherId || '',
      room: primary?.room || '',
      isSplitSlot: !!secondary || primary?.isSplitSlot || false,
      secondarySubjectId: secondary?.subjectId || '',
      secondaryTeacherId: secondary?.teacherId || '',
    });
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    // Delete existing slots for this period
    const existing = currentDaySlots.filter((s) => s.periodNumber === editingSlot.periodNumber);
    existing.forEach((s) => dataService.deleteTimetableSlot(s.id));

    // Save primary slot
    if (editingSlot.subjectId) {
      dataService.saveTimetableSlot({
        id: `tt-${editingSlot.classId}-${editingSlot.dayOfWeek.toLowerCase()}-p${editingSlot.periodNumber}`,
        dayOfWeek: editingSlot.dayOfWeek,
        periodNumber: editingSlot.periodNumber,
        classId: editingSlot.classId,
        subjectId: editingSlot.subjectId,
        teacherId: editingSlot.teacherId,
        room: editingSlot.room,
        isSplitSlot: editingSlot.isSplitSlot,
      });
    }

    // If split slot, save secondary elective subject slot
    if (editingSlot.isSplitSlot && editingSlot.secondarySubjectId) {
      dataService.saveTimetableSlot({
        id: `tt-${editingSlot.classId}-${editingSlot.dayOfWeek.toLowerCase()}-p${editingSlot.periodNumber}-split2`,
        dayOfWeek: editingSlot.dayOfWeek,
        periodNumber: editingSlot.periodNumber,
        classId: editingSlot.classId,
        subjectId: editingSlot.secondarySubjectId,
        teacherId: editingSlot.secondaryTeacherId || '',
        room: `${editingSlot.room || ''} (B)`.trim(),
        isSplitSlot: true,
      });
    }

    setEditingSlot(null);
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod) return;

    if (editingPeriod.id) {
      dataService.updateTimetablePeriod(editingPeriod.id, editingPeriod);
    } else {
      dataService.addTimetablePeriod({
        id: `period-${Date.now()}`,
        periodNumber: editingPeriod.periodNumber || periods.length + 1,
        name: editingPeriod.name || `Period ${periods.length + 1}`,
        startTime: editingPeriod.startTime || '08:00',
        endTime: editingPeriod.endTime || '08:45',
        isBreak: editingPeriod.isBreak || false,
        breakLabel: editingPeriod.breakLabel,
      });
    }
    setEditingPeriod(null);
  };

  const handleDeletePeriod = (id: string) => {
    if (confirm('Are you sure you want to delete this period definition?')) {
      dataService.deleteTimetablePeriod(id);
    }
  };

  return (
    <div id="timetable-management-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Timetable & Schedule</h1>
              <p className="text-xs text-slate-600">
                Configure period timings, weekly timetable for each class, and split elective subjects.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            id="tab-weekly-grid"
            type="button"
            onClick={() => setActiveTab('weekly-grid')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'weekly-grid'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Schedule
          </button>
          <button
            id="tab-period-timings"
            type="button"
            onClick={() => setActiveTab('period-timings')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'period-timings'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Period Timings (07:45 - 08:30)
          </button>
        </div>
      </div>

      {activeTab === 'weekly-grid' ? (
        <div className="space-y-4">
          {/* Controls: Class Selector and Day Pills */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Class:</label>
              <select
                id="select-timetable-class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-sm font-semibold py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isAttendanceEnabled === false ? '(Attendance Disabled)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Days pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                      isSelected
                        ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule Grid for selected day */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">{selectedDay}'s Timetable</span>
                <span className="text-xs text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                  {classes.find((c) => c.id === selectedClassId)?.name}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                {canEditTimetable ? 'Click on any period card to assign or change subject' : 'View only mode'}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {periods.map((period) => {
                if (period.isBreak) {
                  return (
                    <div
                      key={period.id}
                      className="p-3 bg-amber-50/50 flex items-center justify-between px-5 text-xs text-amber-900 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-amber-600" />
                        <span>{period.breakLabel || period.name}</span>
                      </div>
                      <span className="font-mono text-amber-700">
                        {period.startTime} - {period.endTime}
                      </span>
                    </div>
                  );
                }

                // Find slots for this period
                const matchingSlots = currentDaySlots.filter((s) => s.periodNumber === period.periodNumber);
                const hasSlot = matchingSlots.length > 0;
                const isSplit = matchingSlots.length > 1 || matchingSlots[0]?.isSplitSlot;

                return (
                  <div
                    key={period.id}
                    id={`period-slot-row-${period.periodNumber}`}
                    onClick={() => canEditTimetable && handleOpenEditSlot(period)}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      canEditTimetable ? 'cursor-pointer hover:bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Period Timing Badge */}
                    <div className="flex items-center gap-3 min-w-44">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        P{period.periodNumber}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{period.name}</div>
                        <div className="text-xs font-mono text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {period.startTime} - {period.endTime}
                        </div>
                      </div>
                    </div>

                    {/* Subject / Teacher Slot Content */}
                    <div className="flex-1">
                      {hasSlot ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {matchingSlots.map((slot) => {
                            const sub = subjects.find((s) => s.id === slot.subjectId);
                            const teacher = teachers.find((t) => t.id === slot.teacherId);

                            return (
                              <div
                                key={slot.id}
                                className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                                  slot.isSplitSlot
                                    ? 'bg-purple-50 border-purple-200 text-purple-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                              >
                                {slot.isSplitSlot && (
                                  <Split className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                )}
                                <div>
                                  <div className="font-bold">{sub?.name || 'Assigned Subject'}</div>
                                  <div className="text-[11px] opacity-75">
                                    {teacher?.name || 'Teacher unassigned'}
                                    {slot.room ? ` • ${slot.room}` : ''}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-600">No subject scheduled</span>
                      )}
                    </div>

                    {/* Action button */}
                    {canEditTimetable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditSlot(period);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100/60 rounded-lg transition-all shrink-0 self-start sm:self-center"
                      >
                        {hasSlot ? 'Edit Slot' : '+ Assign Subject'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Period Timings Configuration Tab */
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Master Period Timings</h2>
                <p className="text-xs text-slate-600">
                  Super Admins can define periods, intervals, and timings (e.g. Period 1: 07:45 - 08:30).
                </p>
              </div>

              {canEditTimetable && (
                <button
                  type="button"
                  onClick={() =>
                    setEditingPeriod({
                      periodNumber: periods.filter((p) => !p.isBreak).length + 1,
                      name: `Period ${periods.filter((p) => !p.isBreak).length + 1}`,
                      startTime: '08:00',
                      endTime: '08:45',
                      isBreak: false,
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-medium shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Period / Break</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                    <th className="py-2.5 px-3">Type / Number</th>
                    <th className="py-2.5 px-3">Period Name</th>
                    <th className="py-2.5 px-3">Start Time</th>
                    <th className="py-2.5 px-3">End Time</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periods.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3">
                        {p.isBreak ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Break
                          </span>
                        ) : (
                          <span className="font-bold text-slate-800">Period #{p.periodNumber}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {p.name} {p.breakLabel ? `(${p.breakLabel})` : ''}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{p.startTime}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{p.endTime}</td>
                      <td className="py-3 px-3 text-right">
                        {canEditTimetable && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingPeriod(p)}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Edit period timing"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePeriod(p.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete period"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-1">
              Assign Period {editingSlot.periodNumber} ({editingSlot.dayOfWeek})
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Select the subject and teacher scheduled for this period.
            </p>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Subject
                </label>
                <select
                  value={editingSlot.subjectId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    const sub = subjects.find((s) => s.id === subId);
                    setEditingSlot({
                      ...editingSlot,
                      subjectId: subId,
                      teacherId: sub?.assignedTeacherId || editingSlot.teacherId,
                    });
                  }}
                  required
                  className="w-full text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="">-- Select Subject --</option>
                  {classSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) {s.isSplitSubject ? `[Split: ${s.splitGroupName}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher</label>
                <select
                  value={editingSlot.teacherId}
                  onChange={(e) => setEditingSlot({ ...editingSlot, teacherId: e.target.value })}
                  className="w-full text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Hall</label>
                <input
                  type="text"
                  placeholder="e.g. Hall 8A, Lab 2"
                  value={editingSlot.room}
                  onChange={(e) => setEditingSlot({ ...editingSlot, room: e.target.value })}
                  className="w-full text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Split Subject Checkbox */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSlot.isSplitSlot}
                    onChange={(e) => setEditingSlot({ ...editingSlot, isSplitSlot: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Split Subject Period (e.g. Computer App vs Humanities)
                  </span>
                </label>
                <p className="text-[11px] text-slate-600 ml-5 mt-0.5">
                  Allows two separate electives in the same period for split groups.
                </p>
              </div>

              {editingSlot.isSplitSlot && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-purple-900">Secondary Split Elective</div>
                  <div>
                    <label className="block text-xs font-semibold text-purple-900 mb-1">
                      Secondary Subject
                    </label>
                    <select
                      value={editingSlot.secondarySubjectId || ''}
                      onChange={(e) => {
                        const sub = subjects.find((s) => s.id === e.target.value);
                        setEditingSlot({
                          ...editingSlot,
                          secondarySubjectId: e.target.value,
                          secondaryTeacherId: sub?.assignedTeacherId || editingSlot.secondaryTeacherId,
                        });
                      }}
                      className="w-full text-xs p-2 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-600"
                    >
                      <option value="">-- Select Secondary Subject --</option>
                      {classSubjects
                        .filter((s) => s.id !== editingSlot.subjectId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-900 mb-1">
                      Secondary Teacher
                    </label>
                    <select
                      value={editingSlot.secondaryTeacherId || ''}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, secondaryTeacherId: e.target.value })
                      }
                      className="w-full text-xs p-2 bg-white border border-purple-300 rounded-lg focus:outline-none focus:border-purple-600"
                    >
                      <option value="">-- Select Secondary Teacher --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition-all"
                >
                  Save Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Period Definition Modal */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-1">
              {editingPeriod.id ? 'Edit Period Definition' : 'Add Period / Break'}
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Configure period order, timings (e.g. 07:45 - 08:30) and break type.
            </p>

            <form onSubmit={handleSavePeriod} className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingPeriod.isBreak || false}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, isBreak: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Is this an Interval / Lunch & Prayer Break?</span>
                </label>
              </div>

              {!editingPeriod.isBreak ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Period Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editingPeriod.periodNumber || 1}
                    onChange={(e) =>
                      setEditingPeriod({
                        ...editingPeriod,
                        periodNumber: parseInt(e.target.value) || 1,
                        name: `Period ${e.target.value}`,
                      })
                    }
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Break Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning Interval, Lunch & Prayer Break"
                    value={editingPeriod.breakLabel || ''}
                    onChange={(e) =>
                      setEditingPeriod({
                        ...editingPeriod,
                        breakLabel: e.target.value,
                        name: e.target.value,
                      })
                    }
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="07:45"
                    value={editingPeriod.startTime || ''}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, startTime: e.target.value })}
                    required
                    className="w-full text-sm font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="08:30"
                    value={editingPeriod.endTime || ''}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, endTime: e.target.value })}
                    required
                    className="w-full text-sm font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition-all"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
