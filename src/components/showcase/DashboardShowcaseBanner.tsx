import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Settings,
  Flame,
  GraduationCap,
  Crown,
  Trash2,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { dataService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { ClassToppersModal } from './ClassToppersModal';
import { ShowcaseManagementModal } from './ShowcaseManagementModal';
import type { ShowcaseCard } from '../../types';

interface DashboardShowcaseBannerProps {
  currentSection?: string;
  className?: string;
}

export const DashboardShowcaseBanner: React.FC<DashboardShowcaseBannerProps> = ({
  currentSection,
  className = '',
}) => {
  const { currentUser, role } = useAuth();
  const [dbState, setDbState] = useState(() => dataService.getState());

  useEffect(() => {
    return dataService.subscribe(() => {
      setDbState({ ...dataService.getState() });
    });
  }, []);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [cardToDelete, setCardToDelete] = useState<ShowcaseCard | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isClassToppersModalOpen, setIsClassToppersModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

  // Check if current user can manage showcase
  const canManageShowcase = useMemo(() => {
    if (role === 'super_admin' || currentUser?.role === 'super_admin') return true;
    return hasPermission(currentUser, 'showcase_manage', dbState);
  }, [currentUser, role, dbState]);

  // Determine student's classId if student
  const studentClassId = useMemo(() => {
    if (role !== 'student' || !currentUser?.admissionNumber) return undefined;
    const student = dbState.students?.find(
      (s) => s.admissionNumber?.toLowerCase() === currentUser.admissionNumber?.toLowerCase()
    );
    return student?.classId;
  }, [role, currentUser, dbState.students]);

  // All visible cards for current user
  const visibleCards = useMemo(() => {
    return dataService.getVisibleShowcaseCards(
      role,
      studentClassId,
      currentUser?.admissionNumber,
      currentUser?.id
    );
  }, [dbState.showcaseCards, role, studentClassId, currentUser]);

  // Separate Hero / Section Slides (Priority 1 and Priority 2) from Class Toppers (Priority 3)
  const heroAndSectionSlides = useMemo(() => {
    const p1and2 = visibleCards.filter((c) => c.priority === 1 || c.priority === 2);
    // If no priority 1 or 2 exist, fallback to all visible cards
    return p1and2.length > 0 ? p1and2 : visibleCards;
  }, [visibleCards]);

  // Class toppers (Priority 3)
  const classToppers = useMemo(() => {
    return visibleCards.filter((c) => c.priority === 3);
  }, [visibleCards]);

  // Autoplay interval
  useEffect(() => {
    if (heroAndSectionSlides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroAndSectionSlides.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [heroAndSectionSlides.length, isPaused]);

  // Bound check currentSlideIndex
  useEffect(() => {
    if (currentSlideIndex >= heroAndSectionSlides.length) {
      setCurrentSlideIndex(0);
    }
  }, [heroAndSectionSlides.length, currentSlideIndex]);

  if (heroAndSectionSlides.length === 0) {
    if (!canManageShowcase) return null;
    return (
      <div className={`relative w-full rounded-3xl p-5 border border-dashed border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-950 border-amber-500/30 text-center flex flex-col sm:flex-row items-center justify-between gap-4 my-2 shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-amber-200">Spotlight & Toppers Hub is Empty</h4>
            <p className="text-xs text-amber-300/70">
              No active cards in the hub. Add student topper slides or restore default cards.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsManagementModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Spotlight Slide
          </button>
          <button
            onClick={() => {
              const actor = currentUser
                ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
                : { id: 'admin', name: 'Administrator', role: 'super_admin' };
              dataService.resetShowcaseCardsToDefault(actor);
              setDbState({ ...dataService.getState() });
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Defaults
          </button>
        </div>
        {isManagementModalOpen && (
          <ShowcaseManagementModal
            isOpen={isManagementModalOpen}
            onClose={() => setIsManagementModalOpen(false)}
            onSuccess={() => setDbState({ ...dataService.getState() })}
          />
        )}
      </div>
    );
  }

  const currentCard = heroAndSectionSlides[currentSlideIndex] || heroAndSectionSlides[0];
  const isPriorityOne = currentCard.priority === 1;

  const getAccentStyles = (accent?: string) => {
    switch (accent) {
      case 'emerald':
        return {
          cardBg: 'from-emerald-950 via-slate-900 to-teal-950',
          border: 'border-emerald-500/40 hover:border-emerald-400/60',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          glow: 'from-emerald-500/10 via-transparent to-transparent',
          pillBg: 'bg-emerald-500 text-slate-950',
          highlightText: 'text-emerald-400',
        };
      case 'sapphire':
        return {
          cardBg: 'from-blue-950 via-slate-900 to-indigo-950',
          border: 'border-blue-500/40 hover:border-blue-400/60',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          glow: 'from-blue-500/10 via-transparent to-transparent',
          pillBg: 'bg-blue-500 text-white',
          highlightText: 'text-blue-400',
        };
      case 'violet':
        return {
          cardBg: 'from-purple-950 via-slate-900 to-violet-950',
          border: 'border-purple-500/40 hover:border-purple-400/60',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          glow: 'from-purple-500/10 via-transparent to-transparent',
          pillBg: 'bg-purple-500 text-white',
          highlightText: 'text-purple-400',
        };
      case 'ruby':
        return {
          cardBg: 'from-rose-950 via-slate-900 to-red-950',
          border: 'border-rose-500/40 hover:border-rose-400/60',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          glow: 'from-rose-500/10 via-transparent to-transparent',
          pillBg: 'bg-rose-500 text-white',
          highlightText: 'text-rose-400',
        };
      case 'amber':
        return {
          cardBg: 'from-amber-950 via-slate-900 to-orange-950',
          border: 'border-amber-500/40 hover:border-amber-400/60',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          glow: 'from-amber-500/10 via-transparent to-transparent',
          pillBg: 'bg-amber-500 text-slate-950',
          highlightText: 'text-amber-400',
        };
      case 'gold':
      default:
        return {
          cardBg: 'from-amber-950/90 via-slate-900 to-yellow-950/80',
          border: 'border-amber-500/50 hover:border-amber-400/80 shadow-amber-500/10',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          glow: 'from-amber-500/15 via-transparent to-transparent',
          pillBg: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950',
          highlightText: 'text-amber-300',
        };
    }
  };

  const accentStyles = getAccentStyles(currentCard.accentGradient);

  return (
    <div
      id="dashboard-showcase-spotlight-widget"
      className={`w-full mb-6 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Outer Showcase Container */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${
          accentStyles.cardBg
        } border ${
          accentStyles.border
        } shadow-xl transition-all duration-300 ${
          isPriorityOne ? 'sm:p-6 p-4 sm:min-h-[220px]' : 'sm:p-5 p-4 sm:min-h-[195px]'
        }`}
      >
        {/* Subtle Decorative Background Trophy & Watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-4 overflow-hidden">
          <Trophy className="w-80 h-80 text-amber-300 transform translate-x-12 translate-y-6" />
        </div>

        {/* Ambient Top Glow */}
        <div
          className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${accentStyles.glow} pointer-events-none`}
        />

        {/* Top Header Bar: Slide info, slide dots & Management button */}
        <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 backdrop-blur-md text-amber-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              {isPriorityOne ? 'Apex Institutional Honor' : 'Section Honors Spotlight'}
            </span>

            <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">
              {currentCard.examName || "Rabee' Semester Examination 2026-27"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Slide Navigation Buttons */}
            {heroAndSectionSlides.length > 1 && (
              <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-xl p-1 border border-white/10">
                <button
                  id="showcase-prev-slide-btn"
                  onClick={() =>
                    setCurrentSlideIndex((prev) =>
                      prev === 0 ? heroAndSectionSlides.length - 1 : prev - 1
                    )
                  }
                  className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Previous Slide"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-[11px] font-mono font-bold text-white/80 px-1.5">
                  {currentSlideIndex + 1} / {heroAndSectionSlides.length}
                </span>

                <button
                  id="showcase-next-slide-btn"
                  onClick={() =>
                    setCurrentSlideIndex((prev) => (prev + 1) % heroAndSectionSlides.length)
                  }
                  className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Next Slide"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Permission Gated Manager Trigger */}
            {canManageShowcase && (
              <div className="flex items-center gap-1.5">
                <button
                  id="open-showcase-manager-btn"
                  onClick={() => setIsManagementModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold text-amber-200 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Manage Spotlight Cards (Staff & Admin)"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Manage Cards</span>
                </button>
                <button
                  id="delete-current-slide-btn"
                  onClick={() => setCardToDelete(currentCard)}
                  className="p-1 text-rose-300 hover:text-rose-100 hover:bg-rose-500/30 rounded-xl border border-rose-500/20 transition-colors cursor-pointer"
                  title="Delete this slide from Spotlight Hub"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Adaptive size based on Priority 1 vs Priority 2 */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-5">
          {/* Left Column: Trophy / Student Photo + Meta */}
          <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
            {/* Student Photo / Grand Trophy Ring */}
            <div className="relative shrink-0">
              <div
                className={`relative rounded-2xl overflow-hidden shadow-2xl transition-all ${
                  isPriorityOne
                    ? 'w-20 h-20 sm:w-26 sm:h-26 ring-4 ring-amber-400/80'
                    : 'w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-indigo-400/70'
                }`}
              >
                {currentCard.imageUrl ? (
                  <img
                    src={currentCard.imageUrl}
                    alt={currentCard.studentName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white font-black text-2xl">
                    {currentCard.studentName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Gold Crown / Trophy Badge */}
              <div
                className={`absolute -bottom-2 -right-2 rounded-full flex items-center justify-center text-slate-950 font-black shadow-lg ${
                  isPriorityOne
                    ? 'w-8 h-8 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 ring-2 ring-slate-900'
                    : 'w-6 h-6 bg-amber-400 ring-2 ring-slate-900'
                }`}
              >
                {isPriorityOne ? (
                  <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                ) : (
                  <Medal className="w-3.5 h-3.5 text-slate-950" />
                )}
              </div>
            </div>

            {/* Student Name & Title Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${accentStyles.badgeBg} border`}
                >
                  <Trophy className="w-3 h-3 text-amber-400" />
                  {currentCard.badgeText || (isPriorityOne ? 'Apex Topper' : 'Section Topper')}
                </span>

                <span className="text-xs font-bold text-slate-300">
                  {currentCard.sectionOrClass}
                </span>
              </div>

              <h3
                className={`font-black text-white tracking-tight leading-tight ${
                  isPriorityOne ? 'text-lg sm:text-2xl' : 'text-base sm:text-xl'
                }`}
              >
                {currentCard.title}
              </h3>

              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-amber-300">
                  {currentCard.studentName}
                </span>
                {currentCard.studentAdmissionNumber && (
                  <span className="text-xs text-slate-400 font-mono">
                    (Adm #{currentCard.studentAdmissionNumber})
                  </span>
                )}
                {currentCard.scoreDetails && (
                  <span className="text-xs text-slate-300 hidden sm:inline">• {currentCard.scoreDetails}</span>
                )}
              </div>

              {currentCard.description && (
                <p className="text-xs text-slate-300/90 italic mt-1.5 max-w-xl line-clamp-2">
                  "{currentCard.description}"
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Giant Percentage Readout & Distinction Pill */}
          <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
            <div className="text-left md:text-right">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Aggregate Score
              </span>
              <div
                className={`font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-white ${
                  isPriorityOne ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'
                }`}
              >
                {currentCard.percentage}
              </div>
            </div>

            <div className="mt-1 md:mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-lg ${accentStyles.pillBg}`}
              >
                <Flame className="w-3.5 h-3.5" />
                Rank #1 Honor
              </span>
            </div>
          </div>
        </div>

        {/* Slide Indicator Dots */}
        {heroAndSectionSlides.length > 1 && (
          <div className="relative z-10 flex items-center justify-center gap-1.5 mt-4">
            {heroAndSectionSlides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentSlideIndex
                    ? 'w-7 bg-amber-400 shadow-sm shadow-amber-400/50'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA Ribbon: "See class toppers and a arrow icon message and when click on it show them", topper class 1 .... */}
        <div
          id="see-class-toppers-cta-bar"
          onClick={() => setIsClassToppersModalOpen(true)}
          className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between gap-3 text-xs font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 py-3 sm:px-6 transition-all duration-200 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsClassToppersModalOpen(true);
            }
          }}
          aria-label="See class toppers"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <span className="font-bold text-amber-200 group-hover:text-amber-100 flex items-center gap-1.5">
                See Class Toppers
                <span className="text-[11px] font-normal text-slate-300 hidden sm:inline">
                  (Class 1, Class 2, Class 3, Class 4, Class 8-A, Class 10-A...)
                </span>
              </span>
              <p className="text-[11px] text-slate-300 truncate hidden md:block">
                Click to explore top ranked students across every division with full scorecards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-amber-300 group-hover:text-amber-200 font-bold">
            <span className="hidden sm:inline text-xs">
              View {classToppers.length} Class Ranks
            </span>
            <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-amber-400 group-hover:text-slate-950 flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Class Toppers Interactive Modal */}
      <ClassToppersModal
        isOpen={isClassToppersModalOpen}
        onClose={() => setIsClassToppersModalOpen(false)}
        classToppers={classToppers}
        examName={currentCard.examName}
      />

      {/* Showcase Management Modal (Permission Gated) */}
      {canManageShowcase && (
        <ShowcaseManagementModal
          isOpen={isManagementModalOpen}
          onClose={() => setIsManagementModalOpen(false)}
          onSuccess={() => setDbState({ ...dataService.getState() })}
        />
      )}

      {/* In-App Confirmation Modal for Banner Slide Deletion (Iframe Safe) */}
      {cardToDelete && (
        <div
          id="delete-slide-confirm-dialog"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Spotlight Slide</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Remove this card from Spotlight & Toppers Hub
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{cardToDelete.title}"</strong> ({cardToDelete.studentName})?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="cancel-delete-slide-btn"
                onClick={() => setCardToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-slide-btn"
                onClick={() => {
                  const actor = currentUser
                    ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
                    : { id: 'admin', name: 'Administrator', role: 'super_admin' };
                  dataService.deleteShowcaseCard(cardToDelete.id, actor);
                  setDbState({ ...dataService.getState() });
                  setCurrentSlideIndex(0);
                  setCardToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete Slide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
