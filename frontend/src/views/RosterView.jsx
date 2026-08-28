import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  Printer,
  Share2,
  Edit2,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MONTH_NAMES, formatDisplayDate } from '../utils/dateUtils';
import ShiftEditModal from '../components/ShiftEditModal';
import WhatsAppShareModal from '../components/WhatsAppShareModal';

export default function RosterView({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  roster,
  allStaff,
  approvedLeaves,
  onGenerateRoster,
  onPublishRoster,
  onUpdateRoster,
  loading,
  error
}) {
  const [editingShift, setEditingShift] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handlePublishClick = async () => {
    if (!roster) return;
    if (!window.confirm('Are you sure you want to publish this roster? Published rosters are finalized for staff.')) {
      return;
    }
    try {
      setIsPublishing(true);
      await onPublishRoster(roster._id);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#ffffff']
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveShiftAssignment = async (shiftDate, newStaffIds) => {
    if (!roster) return;
    const updatedShifts = roster.shifts.map((s) => {
      const sDate = new Date(s.date).toISOString().split('T')[0];
      const targetDate = new Date(shiftDate).toISOString().split('T')[0];
      if (sDate === targetDate) {
        return {
          date: s.date,
          assignedStaff: newStaffIds
        };
      }
      return {
        date: s.date,
        assignedStaff: s.assignedStaff.map((staff) => (typeof staff === 'object' ? staff._id : staff))
      };
    });

    await onUpdateRoster(roster._id, updatedShifts);
  };

  const isDraft = roster && roster.status === 'draft';
  const isPublished = roster && roster.status === 'published';

  return (
    <div>
      {/* Control Bar: Month Picker & Actions */}
      <div className="control-bar">
        <div className="month-picker-group">
          <button className="btn-icon" onClick={handlePrevMonth} title="Previous Month" aria-label="Previous Month">
            <ChevronLeft size={18} />
          </button>
          <div className="month-display">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </div>
          <button className="btn-icon" onClick={handleNextMonth} title="Next Month" aria-label="Next Month">
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          {roster && (
            <span className={`badge ${isPublished ? 'badge-green' : 'badge-amber'}`}>
              {isPublished ? <CheckCircle2 size={13} /> : <Clock size={13} />}
              {isPublished ? 'Published Schedule' : 'Draft Schedule'}
            </span>
          )}

          {isDraft && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePublishClick}
              disabled={isPublishing || loading}
            >
              <Send size={15} />
              <span>{isPublishing ? 'Publishing...' : 'Publish Roster'}</span>
            </button>
          )}

          {roster && (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 size={15} />
                <span>WhatsApp</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => window.print()}
                title="Print roster"
              >
                <Printer size={15} />
                <span>Print</span>
              </button>
            </>
          )}

          {!roster && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onGenerateRoster(selectedYear, selectedMonth)}
              disabled={loading}
            >
              <Sparkles size={15} />
              <span>Generate Draft</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'var(--red-50)',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          color: 'var(--red-700)',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Roster View or Empty State */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="brand-logo" style={{ margin: '0 auto 1rem', animation: 'spin 2s linear infinite' }}>
            <CalendarIcon size={24} />
          </div>
          <h3 style={{ fontSize: '1.125rem', color: 'var(--gray-800)' }}>Loading roster data...</h3>
        </div>
      ) : roster && roster.shifts && roster.shifts.length > 0 ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Showing <strong>{roster.shifts.length}</strong> duty shifts (Monday to Thursday)
            </p>
            {isDraft && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--green-700)', fontWeight: 600 }}>
                💡 Click any shift card to edit staff assignments
              </span>
            )}
          </div>

          <div className="calendar-grid">
            {roster.shifts.map((shift, idx) => {
              const shiftDate = new Date(shift.date);
              const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(shiftDate);
              const dateNum = shiftDate.getDate();

              return (
                <div
                  key={idx}
                  className="shift-card"
                  onClick={() => {
                    if (isDraft) {
                      setEditingShift(shift);
                    }
                  }}
                  style={{ cursor: isDraft ? 'pointer' : 'default' }}
                >
                  <div>
                    <div className="shift-card-header">
                      <div>
                        <span className="shift-day-badge">{dayName}</span>
                        <div className="shift-date-text" style={{ marginTop: '2px' }}>
                          {formatDisplayDate(shift.date)}
                        </div>
                      </div>
                      {isDraft && (
                        <div className="btn-icon" style={{ padding: '4px' }} title="Edit shift">
                          <Edit2 size={13} />
                        </div>
                      )}
                    </div>

                    <div className="shift-staff-list">
                      {(shift.assignedStaff || []).map((staff, sIdx) => {
                        const isObj = typeof staff === 'object';
                        const staffName = isObj ? staff.name : 'Staff Member';
                        const staffPhone = isObj ? staff.phonenumber : '';
                        const initials = staffName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <div key={sIdx} className="staff-pill">
                            <div className="staff-pill-left">
                              <div className="staff-avatar">{initials}</div>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <div>{staffName}</div>
                                {staffPhone && (
                                  <div style={{ fontSize: '0.6875rem', color: 'var(--gray-500)' }}>
                                    {staffPhone}
                                  </div>
                                )}
                              </div>
                            </div>
                            {staffPhone && (
                              <a
                                href={`tel:${staffPhone}`}
                                className="btn-icon"
                                style={{ padding: '4px', color: 'var(--green-700)', background: 'transparent', border: 'none' }}
                                onClick={(e) => e.stopPropagation()}
                                title={`Call ${staffName}`}
                              >
                                <Phone size={14} />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.6875rem', color: 'var(--gray-500)', textAlign: 'right', paddingTop: '4px' }}>
                    Shift #{idx + 1} • 2 Staff on Duty
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div className="stat-icon" style={{ width: '56px', height: '56px', margin: '0 auto 1.25rem', background: 'var(--green-50)', color: 'var(--green-600)' }}>
            <Sparkles size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
            No Roster for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            Generate a balanced, conflict-free monthly schedule in seconds. The algorithm pairs staff fairly, avoids consecutive shifts, and respects approved leave.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onGenerateRoster(selectedYear, selectedMonth)}
            disabled={loading}
          >
            <Sparkles size={16} />
            <span>Generate Draft Roster for {MONTH_NAMES[selectedMonth - 1]}</span>
          </button>
        </div>
      )}

      {/* Shift Customization Modal */}
      {editingShift && (
        <ShiftEditModal
          isOpen={Boolean(editingShift)}
          onClose={() => setEditingShift(null)}
          shift={editingShift}
          allStaff={allStaff}
          approvedLeaves={approvedLeaves}
          onSaveShift={handleSaveShiftAssignment}
        />
      )}

      {/* WhatsApp Share Modal */}
      {isShareModalOpen && roster && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          roster={roster}
        />
      )}
    </div>
  );
}
