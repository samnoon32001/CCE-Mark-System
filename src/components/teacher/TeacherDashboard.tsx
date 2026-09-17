import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { DashboardShowcaseBanner } from '../showcase/DashboardShowcaseBanner';
import {
  School,
  BookOpen,
  Users,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sliders,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Bell,
  BellRing,
  Sparkles,
  Coffee,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import type { NavSection } from '../layout/Sidebar';
import type { DayOfWeek, TimetablePeriodDefinition, TimetableSlot } from '../../types';

export const TeacherDashboard: React.FC<{ onNavigate: (section: NavSection) => void }> = ({
  onNavigate,
}) => {
  const { currentUser, isClassTeacher } = useAuth();
  const state = dataService.getState();

  // Find teacher record
  const teacher = state.teachers.find(
    (t) => t.username === currentUser?.username || t.email === currentUser?.email
  );

  const teacherId = teacher?.id || '';

  // Assigned subjects
  const assignedSubjects = state.subjects.filter(
    (s) => s.assignedTeacherId === teacherId || teacher?.assignedSubjectIds?.includes(s.id)
  );

  // Assigned classes (from subjects + direct assignedClassIds)
  const assignedClassIds = Array.from(
    new Set([
      ...(teacher?.assignedClassIds || []),
      ...assignedSubjects.map((s) => s.classId),
    ])
  );
  const assignedClasses = state.classes.filter((c) => assignedClassIds.includes(c.id));

  // Enrolled students in teacher's classes
  const teacherStudents = state.students.filter((s) => assignedClassIds.includes(s.classId));

  // Marks entered for teacher's subjects
  const teacherSubjectIds = assignedSubjects.map((s) => s.id);
  const teacherMarks = state.marks.filter((m) => teacherSubjectIds.includes(m.subjectId));

  // Class teacher classes
  const classTeacherClasses = state.classes.filter(
    (c) => c.classTeacherId === teacherId || teacher?.classTeacherOfClassIds?.includes(c.id)
  );

  // ⏰ Live Time & Timetable Calculations
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [simulateAlert, setSimulateAlert] = useState(false);

  // Update clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const daysOfWeekList: DayOfWeek[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const todayDayOfWeek = daysOfWeekList[currentTime.getDay()];
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDayOfWeek);

  const timetablePeriods = useMemo(() => {
    return dataService.getTimetablePeriods();
  }, [state]);

  const timetableSlots = useMemo(() => {
    return dataService.getTimetableSlots();
  }, [state]);

  // Current time in minutes from 00:00
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const parseTimeToMin = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Compute all periods for today with teacher assignment metadata
  const todayPeriodsAnalysis = useMemo(() => {
    return timetablePeriods.map((p) => {
      // Find teacher slot on today
      const slot = timetableSlots.find(
        (s) =>
          s.dayOfWeek === todayDayOfWeek &&
          s.periodNumber === p.periodNumber &&
          (s.teacherId === teacherId || teacherSubjectIds.includes(s.subjectId))
      );

      const subject = slot ? state.subjects.find((s) => s.id === slot.subjectId) : null;
      const cls = slot ? state.classes.find((c) => c.id === slot.classId) : null;

      const startMinutes = parseTimeToMin(p.startTime);
      const endMinutes = parseTimeToMin(p.endTime);
      const isOngoing = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      const isUpcoming = startMinutes > currentMinutes;
      const diffMinutes = startMinutes - currentMinutes;

      return {
        period: p,
        slot,
        subject,
        cls,
        startMinutes,
        endMinutes,
        isOngoing,
        isUpcoming,
        diffMinutes,
      };
    });
  }, [timetablePeriods, timetableSlots, todayDayOfWeek, teacherId, teacherSubjectIds, state, currentMinutes]);

  // Determine active/next teaching periods
  const todayTeachingPeriods = todayPeriodsAnalysis.filter((p) => !p.period.isBreak && p.slot != null);
  const activeTeachingPeriods = todayTeachingPeriods.length > 0
    ? todayTeachingPeriods
    : todayPeriodsAnalysis.filter((p) => !p.period.isBreak);

  const ongoingPeriod = activeTeachingPeriods.find((p) => p.isOngoing);
  const nextPeriod = activeTeachingPeriods.find((p) => p.isUpcoming);

  // 10-minute alert condition
  const isAlertActive =
    simulateAlert ||
    (nextPeriod != null && nextPeriod.diffMinutes > 0 && nextPeriod.diffMinutes <= 10);

  const alertDiff = simulateAlert ? 8 : (nextPeriod?.diffMinutes ?? 0);

  // Next period formatted string (e.g. "English S1, 09:45 am")
  const nextPeriodFormatted = useMemo(() => {
    if (nextPeriod) {
      const sub = nextPeriod.subject?.name || (assignedSubjects[0]?.name || 'English');
      const cls = nextPeriod.cls?.name || (assignedClasses[0]?.name || 'S1');
      const time = nextPeriod.period.startTime || '09:45 am';
      return `${sub} ${cls}, ${time}`;
    }
    const fallbackSub = assignedSubjects[0]?.name || 'English';
    const fallbackCls = assignedClasses[0]?.name || 'S1';
    return `${fallbackSub} ${fallbackCls}, 09:45 am`;
  }, [nextPeriod, assignedSubjects, assignedClasses]);

  // Periods for currently selected day (for timetable display)
  // Omits all interval breaks like Morning Interval, Prayer & Lunch Break as requested
  const displayDayPeriods = useMemo(() => {
    return timetablePeriods
      .filter((p) => !p.isBreak && !p.breakLabel)
      .map((p) => {
        // Check for slot on selectedDay
        const slot = timetableSlots.find(
          (s) =>
            s.dayOfWeek === selectedDay &&
            s.periodNumber === p.periodNumber &&
            (s.teacherId === teacherId || teacherSubjectIds.includes(s.subjectId))
        );

        // If no direct slot, check if teacher is class teacher of any class having a slot
        const classTeacherSlot =
          !slot && classTeacherClasses.length > 0
            ? timetableSlots.find(
                (s) =>
                  s.dayOfWeek === selectedDay &&
                  s.periodNumber === p.periodNumber &&
                  classTeacherClasses.some((ctc) => ctc.id === s.classId)
              )
            : null;

        const effectiveSlot = slot || classTeacherSlot;
        let subject = effectiveSlot
          ? state.subjects.find((s) => s.id === effectiveSlot.subjectId)
          : null;
        let cls = effectiveSlot
          ? state.classes.find((c) => c.id === effectiveSlot.classId)
          : null;

        // Fallback to assigned subject/class so every period has subject & class listed
        if (!subject && assignedSubjects.length > 0) {
          const sIdx = (p.periodNumber - 1) % assignedSubjects.length;
          subject = assignedSubjects[sIdx];
        }
        if (!cls && assignedClasses.length > 0) {
          const cIdx = (p.periodNumber - 1) % assignedClasses.length;
          cls = assignedClasses[cIdx];
        }

        const startMinutes = parseTimeToMin(p.startTime);
        const endMinutes = parseTimeToMin(p.endTime);
        const isToday = selectedDay === todayDayOfWeek;
        const isOngoing = isToday && currentMinutes >= startMinutes && currentMinutes < endMinutes;
        const isNext = isToday && nextPeriod?.period.id === p.id;

        return {
          period: p,
          slot: effectiveSlot,
          subject,
          cls,
          startMinutes,
          endMinutes,
          isOngoing,
          isNext,
        };
      });
  }, [
    timetablePeriods,
    timetableSlots,
    selectedDay,
    todayDayOfWeek,
    teacherId,
    teacherSubjectIds,
    classTeacherClasses,
    state,
    currentMinutes,
    nextPeriod,
    assignedSubjects,
    assignedClasses,
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Spotlight Toppers Banner (Ad style priority carousel) */}
      <DashboardShowcaseBanner />

      {/* Compact Streamlined Welcome & Timetable Card */}
      <div className="bg-slate-900 dark:bg-slate-900/95 rounded-2xl p-4 sm:p-5 text-white shadow-xs border border-slate-800 space-y-3.5 transition-all">
        {/* Streamlined Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome back, {teacher?.name || currentUser?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-slate-400">
                {assignedSubjects.length} Total Subjects • Class Teacher of {classTeacherClasses.length > 0 ? classTeacherClasses.length : 3}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="text-slate-400">Your Next Period:</span>
                <span className="font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  {nextPeriodFormatted}
                </span>
              </span>
            </div>
          </div>

          {/* End of section: Arrow button to view Today's Timetable */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              id="btn-toggle-today-timetable"
              type="button"
              onClick={() => setIsTimetableOpen(!isTimetableOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border shadow-xs ${
                isTimetableOpen
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Today&apos;s Timetable</span>
              {isTimetableOpen ? (
                <ChevronUp className="w-4 h-4 text-white transition-transform" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 transition-transform" />
              )}
            </button>

            <button
              id="btn-open-mark-entry"
              type="button"
              onClick={() => onNavigate('mark-entry')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Mark Entry →</span>
            </button>
          </div>
        </div>

        {/* 🔔 10-Minute Before Next Period Notification Banner */}
        {isAlertActive && (
          <div
            id="next-period-10min-alert"
            className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-indigo-500/20 border border-amber-400/50 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn"
          >
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 shadow-inner animate-bounce">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Next Period starts in {alertDiff} minutes!</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-400/30 text-amber-200 uppercase tracking-wide">
                    {nextPeriod?.period.startTime || 'Upcoming'}
                  </span>
                </div>
                <div className="text-amber-200/90 text-[11px] mt-0.5">
                  {nextPeriod?.subject ? (
                    <>
                      <strong>{nextPeriod.period.name}</strong>: {nextPeriod.subject.name} ({nextPeriod.cls?.name || 'Class'}) • Room: {nextPeriod.slot?.room || 'Standard Hall'}
                    </>
                  ) : (
                    <>
                      <strong>{nextPeriod?.period.name || 'Period'}</strong> starting soon ({nextPeriod?.period.startTime} - {nextPeriod?.period.endTime})
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onNavigate('attendance')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Open Roll Call</span>
              </button>
              {simulateAlert && (
                <button
                  type="button"
                  onClick={() => setSimulateAlert(false)}
                  className="px-2 py-1 text-[10px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Today's Timetable Tray */}
        {isTimetableOpen && (
          <div
            id="dashboard-timetable-accordion"
            className="pt-3 border-t border-slate-800 space-y-3 animate-fadeIn"
          >
            {/* Days Selector & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Weekly Schedule:</span>
                <div className="flex items-center gap-1 overflow-x-auto py-1">
                  {daysOfWeekList.map((d) => {
                    const isToday = d === todayDayOfWeek;
                    const isSelected = d === selectedDay;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDay(d)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span>{d.slice(0, 3)}</span>
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status / Alert simulation controls */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="hidden sm:inline">
                  {selectedDay === todayDayOfWeek ? 'Showing Today' : `Viewing ${selectedDay}`}
                </span>
                <button
                  type="button"
                  onClick={() => setSimulateAlert(!simulateAlert)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  title="Preview the 10-minute upcoming notification banner"
                >
                  {simulateAlert ? 'Stop Alert Preview' : 'Test 10m Alert'}
                </button>
              </div>
            </div>

            {/* Timetable Period Cards Grid - Only Teaching Periods, Distinct Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {displayDayPeriods.map((item) => {
                const { period, slot, subject, cls, isOngoing, isNext } = item;

                return (
                  <div
                    key={period.id}
                    className={`relative p-3 rounded-xl border transition-all duration-200 min-h-[110px] flex flex-col justify-between ${
                      isNext
                        ? 'bg-gradient-to-br from-amber-950/90 via-slate-900 to-orange-950/70 border-2 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                        : isOngoing
                        ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-teal-950/70 border-2 border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                        : slot
                        ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-800/40 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    {/* Distinct Badges for Next Period vs Now Active */}
                    {isNext && (
                      <div className="absolute -top-2 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Next Period
                      </div>
                    )}
                    {isOngoing && (
                      <div className="absolute -top-2 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                        Now Active
                      </div>
                    )}

                    <div>
                      {/* Period No and Time */}
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className={`font-bold ${isNext ? 'text-amber-300' : isOngoing ? 'text-emerald-300' : 'text-slate-300'}`}>
                          {period.name}
                        </span>
                        <span className={`font-mono text-[10px] ${isNext ? 'text-amber-200/90' : isOngoing ? 'text-emerald-200/90' : 'text-slate-400'}`}>
                          {period.startTime} - {period.endTime}
                        </span>
                      </div>

                      {/* Subject and Class */}
                      <div>
                        <div className="font-bold text-sm text-white leading-tight">
                          {subject?.name || 'Assigned Subject'}
                        </div>
                        <div className={`text-xs mt-0.5 font-medium ${isNext ? 'text-amber-300' : isOngoing ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {cls?.name || 'Class'}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action */}
                    <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[10px]">
                      <button
                        type="button"
                        onClick={() => onNavigate('attendance')}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <CalendarCheck className="w-3 h-3" />
                        <span>Attendance</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('mark-entry')}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Marks</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('teacher-classes')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer border-l-4 border-l-indigo-500 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">My Classes</span>
            <span className="text-slate-400 dark:text-slate-500"><School className="w-4 h-4" /></span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {assignedClasses.length < 10 ? `0${assignedClasses.length}` : assignedClasses.length}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Teaching Sections</div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('teacher-subjects')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer border-l-4 border-l-purple-500 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">My Subjects</span>
            <span className="text-slate-400 dark:text-slate-500"><BookOpen className="w-4 h-4" /></span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {assignedSubjects.length < 10 ? `0${assignedSubjects.length}` : assignedSubjects.length}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Allocated Courses</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Students</span>
            <span className="text-slate-400 dark:text-slate-500"><Users className="w-4 h-4" /></span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {teacherStudents.length}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Across your cohorts</div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('mark-entry')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer border-l-4 border-l-amber-500 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Marks Logged</span>
            <span className="text-slate-400 dark:text-slate-500"><CheckSquare className="w-4 h-4" /></span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {teacherMarks.length}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">CCE Level Records</div>
          </div>
        </div>
      </div>

      {/* Class Teacher Responsibility Highlight (if assigned) */}
      {classTeacherClasses.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-5 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Class Teacher Supervision Role Active
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                You are assigned as Class Teacher for:{' '}
                <span className="font-semibold">
                  {classTeacherClasses.map((c) => c.name).join(', ')}
                </span>
                . You have exclusive access to view consolidated student performance across all subjects.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('class-teacher-view')}
            className="px-4 py-2 text-xs font-semibold text-amber-950 dark:text-amber-100 bg-amber-300 hover:bg-amber-400 dark:bg-amber-800 dark:hover:bg-amber-700 rounded-md transition shrink-0 shadow-xs cursor-pointer"
          >
            Open Class Teacher View →
          </button>
        </div>
      )}

      {/* Assigned Subjects Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              My Assigned Subjects & Mark Entry Status
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select any subject below to enter or edit student marks
            </p>
          </div>
          <button
            onClick={() => onNavigate('teacher-subjects')}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
          >
            All Subjects <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedSubjects.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              No subjects currently assigned to your instructor profile.
            </div>
          ) : (
            assignedSubjects.map((sub) => {
              const cls = state.classes.find((c) => c.id === sub.classId);
              const studentsCount = state.students.filter((s) => s.classId === sub.classId).length;
              const levels = state.evaluationLevels.filter((l) => l.subjectId === sub.id);
              const marksCount = state.marks.filter((m) => m.subjectId === sub.id).length;

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {sub.code}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                        {cls?.name || 'Class'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {sub.name}
                    </h3>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{studentsCount} Enrolled Students</span>
                      <span>{levels.length} CCE Levels</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigate('evaluation-levels')}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition cursor-pointer"
                      title="Manage Evaluation Levels"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      Levels ({levels.length})
                    </button>
                    <button
                      onClick={() => onNavigate('mark-entry')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition cursor-pointer"
                    >
                      Enter Marks
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
