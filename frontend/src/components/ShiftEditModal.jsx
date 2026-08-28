import React, { useState } from 'react';
import { X, UserCheck, AlertTriangle, Check } from 'lucide-react';
import { formatDisplayDate } from '../utils/dateUtils';

export default function ShiftEditModal({
  isOpen,
  onClose,
  shift,
  allStaff,
  approvedLeaves,
  onSaveShift
}) {
  if (!isOpen || !shift) return null;

  const currentIds = (shift.assignedStaff || []).map((s) => (typeof s === 'object' ? s._id : s));
  const [staff1, setStaff1] = useState(currentIds[0] || '');
  const [staff2, setStaff2] = useState(currentIds[1] || '');
  const [error, setError] = useState('');

  const shiftDate = new Date(shift.date);
  shiftDate.setHours(0, 0, 0, 0);

  // Helper to check if a staff member is on leave on this date
  const isStaffOnLeave = (staffId) => {
    if (!staffId || !approvedLeaves) return false;
    return approvedLeaves.some((leave) => {
      const lStaffId = typeof leave.staffId === 'object' ? leave.staffId._id : leave.staffId;
      if (lStaffId !== staffId) return false;
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return shiftDate >= start && shiftDate <= end;
    });
  };

  const handleSave = () => {
    setError('');
    if (!staff1 || !staff2) {
      setError('Please assign exactly 2 staff members.');
      return;
    }
    if (staff1 === staff2) {
      setError('Staff 1 and Staff 2 must be different people.');
      return;
    }

    if (isStaffOnLeave(staff1)) {
      const sObj = allStaff.find((s) => s._id === staff1);
      setError(`Warning: ${sObj?.name || 'Staff 1'} is on approved leave on this date!`);
      return;
    }

    if (isStaffOnLeave(staff2)) {
      const sObj = allStaff.find((s) => s._id === staff2);
      setError(`Warning: ${sObj?.name || 'Staff 2'} is on approved leave on this date!`);
      return;
    }

    onSaveShift(shift.date, [staff1, staff2]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ width: '36px', height: '36px' }}>
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Customize Shift Assignment</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                {formatDisplayDate(shift.date)}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              background: 'var(--red-50)',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              color: 'var(--red-700)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">First Assigned Staff Member:</label>
            <select
              className="form-select"
              value={staff1}
              onChange={(e) => setStaff1(e.target.value)}
            >
              <option value="">-- Select Staff 1 --</option>
              {allStaff.filter((s) => s.active).map((s) => {
                const onLeave = isStaffOnLeave(s._id);
                return (
                  <option key={s._id} value={s._id} disabled={s._id === staff2}>
                    {s.name} ({s.phonenumber}) {onLeave ? '⚠️ [On Leave]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Second Assigned Staff Member:</label>
            <select
              className="form-select"
              value={staff2}
              onChange={(e) => setStaff2(e.target.value)}
            >
              <option value="">-- Select Staff 2 --</option>
              {allStaff.filter((s) => s.active).map((s) => {
                const onLeave = isStaffOnLeave(s._id);
                return (
                  <option key={s._id} value={s._id} disabled={s._id === staff1}>
                    {s.name} ({s.phonenumber}) {onLeave ? '⚠️ [On Leave]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{
            background: 'var(--gray-50)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--gray-600)'
          }}>
            ℹ️ <strong>Rule Requirement:</strong> Every shift must have exactly 2 active staff members assigned. Monday–Thursday shifts only.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            <Check size={16} />
            <span>Save Shift</span>
          </button>
        </div>
      </div>
    </div>
  );
}
