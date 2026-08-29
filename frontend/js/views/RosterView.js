import { state, setState } from '../state.js';
import { api } from '../api.js';
import { MONTH_NAMES, formatDisplayDate, showToast, triggerConfetti } from '../utils.js';
import { openShiftEditModal, openWhatsAppModal } from '../components/Modals.js';

export function renderRosterView(container) {
  const { selectedYear, selectedMonth, currentRoster, staffList, leavesList, loading, error, currentUser, isAdmin } = state;
  const isDraft = currentRoster && currentRoster.status === 'draft';
  const isPublished = currentRoster && currentRoster.status === 'published';

  const approvedLeaves = leavesList.filter((l) => l.status === 'approved');

  // Count current user's shifts in this month
  const myShiftsCount = currentRoster?.shifts
    ? currentRoster.shifts.filter((s) =>
        (s.assignedStaff || []).some((st) => {
          const sId = typeof st === 'object' && st !== null ? st._id : st;
          return sId === currentUser?._id;
        })
      ).length
    : 0;

  container.innerHTML = `
    <!-- Staff Personalized Greeting Banner -->
    <div style="background: linear-gradient(135deg, var(--white), var(--gray-50)); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; box-shadow: var(--shadow-xs);">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div class="staff-avatar" style="width: 44px; height: 44px; font-size: 1rem; background: ${isAdmin ? 'var(--green-700)' : 'var(--green-600)'}; box-shadow: var(--shadow-green);">
          ${currentUser?.name ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
        </div>
        <div>
          <h2 style="font-size: 1.125rem; color: var(--gray-900);">
            Hello, ${currentUser?.name || 'Staff Member'} 👋
          </h2>
          <p style="font-size: 0.8125rem; color: var(--gray-600);">
            ${isAdmin ? '👑 Administrator & Scheduling Manager' : '📱 Staff Portal • Your shifts are highlighted below'}
          </p>
        </div>
      </div>

      <div style="display: flex; gap: 1rem; align-items: center;">
        <div style="text-align: right;">
          <div style="font-size: 0.6875rem; color: var(--gray-500); text-transform: uppercase; font-weight: 600;">
            ${MONTH_NAMES[selectedMonth - 1]} Shifts
          </div>
          <div style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--green-800);">
            ${myShiftsCount} ${myShiftsCount === 1 ? 'Duty Shift' : 'Duty Shifts'}
          </div>
        </div>

        <div style="border-left: 1px solid var(--gray-200); padding-left: 1rem; text-align: right;">
          <div style="font-size: 0.6875rem; color: var(--gray-500); text-transform: uppercase; font-weight: 600;">
            Leave Balance
          </div>
          <div style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--gray-900);">
            ${currentUser?.leaveBalance !== undefined ? currentUser.leaveBalance : 30} Days
          </div>
        </div>
      </div>
    </div>

    <!-- Top Control Bar -->
    <div class="control-bar">
      <div class="month-picker-group">
        <button class="btn-icon" id="btn-prev-month" title="Previous Month" aria-label="Previous Month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div class="month-display">
          ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}
        </div>
        <button class="btn-icon" id="btn-next-month" title="Next Month" aria-label="Next Month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap;">
        ${currentRoster ? `
          <span class="badge ${isPublished ? 'badge-green' : 'badge-amber'}">
            ${isPublished ? `
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Published Roster</span>
            ` : `
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Draft Roster</span>
            `}
          </span>
        ` : ''}

        ${isAdmin && isDraft ? `
          <button class="btn btn-primary btn-sm" id="btn-publish-roster">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            <span>Publish Roster</span>
          </button>
        ` : ''}

        ${isAdmin && currentRoster ? `
          <button class="btn btn-secondary btn-sm" id="btn-share-whatsapp">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            <span>WhatsApp</span>
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-print-roster">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            <span>Print</span>
          </button>
        ` : ''}

        ${isAdmin && !currentRoster ? `
          <button class="btn btn-primary btn-sm" id="btn-generate-draft">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"></path></svg>
            <span>Generate Draft</span>
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Error Alert -->
    ${error ? `
      <div style="background: var(--red-50); border: 1px solid var(--red-100); border-radius: var(--radius-lg); padding: 1rem; color: var(--red-700); font-size: 0.875rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>${error}</span>
      </div>
    ` : ''}

    <!-- Shift Content or Empty State -->
    ${loading ? `
      <div class="card" style="text-align: center; padding: 3rem 1rem;">
        <div class="brand-logo" style="margin: 0 auto 1rem; animation: spin 2s linear infinite;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
        </div>
        <h3 style="font-size: 1.125rem; color: var(--gray-800);">Loading shifts...</h3>
      </div>
    ` : currentRoster && currentRoster.shifts && currentRoster.shifts.length > 0 ? `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <p style="font-size: 0.875rem; color: var(--gray-600);">
            Showing <strong>${currentRoster.shifts.length}</strong> duty shifts (Monday to Thursday)
          </p>
          ${isAdmin && isDraft ? `
            <span style="font-size: 0.8125rem; color: var(--green-700); font-weight: 600;">
              💡 Tap any shift card to edit staff assignments
            </span>
          ` : ''}
        </div>

        <div class="calendar-grid">
          ${currentRoster.shifts.map((shift, idx) => {
            const shiftDate = new Date(shift.date);
            const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(shiftDate);

            // Check if current user is assigned
            const isUserAssigned = (shift.assignedStaff || []).some((st) => {
              const sId = typeof st === 'object' && st !== null ? st._id : st;
              return sId === currentUser?._id;
            });

            return `
              <div
                class="shift-card"
                data-shift-idx="${idx}"
                style="${isUserAssigned ? 'border: 2px solid var(--green-500); background: #fafffc;' : ''} ${isAdmin && isDraft ? 'cursor: pointer;' : ''}"
              >
                <div>
                  <div class="shift-card-header">
                    <div>
                      <div style="display: flex; align-items: center; gap: 0.375rem;">
                        <span class="shift-day-badge">${dayName}</span>
                        ${isUserAssigned ? `
                          <span class="badge badge-green" style="font-size: 0.625rem; padding: 1px 6px;">
                            ⭐ You're On Duty
                          </span>
                        ` : ''}
                      </div>
                      <div class="shift-date-text" style="margin-top: 3px;">
                        ${formatDisplayDate(shift.date)}
                      </div>
                    </div>
                    ${isAdmin && isDraft ? `
                      <div class="btn-icon" style="padding: 4px;" title="Edit shift">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </div>
                    ` : ''}
                  </div>

                  <div class="shift-staff-list">
                    ${(shift.assignedStaff || []).map((staff) => {
                      const isObj = typeof staff === 'object' && staff !== null;
                      const name = isObj ? staff.name : 'Unassigned';
                      const phone = isObj ? staff.phonenumber : '';
                      const sId = isObj ? staff._id : staff;
                      const isMe = sId === currentUser?._id;
                      const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

                      return `
                        <div class="staff-pill" style="${isMe ? 'background: var(--green-100); border-color: var(--green-300);' : ''}">
                          <div class="staff-pill-left">
                            <div class="staff-avatar" style="background: ${isMe ? 'var(--green-700)' : 'var(--green-600)'};">${initials}</div>
                            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                              <div><strong>${name}</strong> ${isMe ? '<span style="color: var(--green-800); font-weight:700;">(You)</span>' : ''}</div>
                              ${phone ? `<div style="font-size: 0.6875rem; color: var(--gray-500);">${phone}</div>` : ''}
                            </div>
                          </div>
                          ${phone ? `
                            <a href="tel:${phone}" class="btn-icon" style="padding: 4px; color: var(--green-700); background: transparent; border: none;" title="Call ${name}">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            </a>
                          ` : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div style="font-size: 0.6875rem; color: var(--gray-500); text-align: right; padding-top: 4px;">
                  Shift #${idx + 1} • 2 on duty
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : `
      <div class="card" style="text-align: center; padding: 3.5rem 1.5rem;">
        <div class="stat-icon" style="width: 56px; height: 56px; margin: 0 auto 1.25rem; background: var(--green-50); color: var(--green-600);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"></path></svg>
        </div>
        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: var(--gray-900);">
          No Roster Scheduled for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}
        </h3>
        <p style="font-size: 0.875rem; color: var(--gray-600); max-width: 440px; margin: 0 auto 1.5rem;">
          ${isAdmin
            ? 'Generate a balanced, conflict-free monthly schedule in 1 click. Shifts are assigned from Monday to Thursday respecting past pairing history and leaves.'
            : 'The manager has not generated a duty schedule for this month yet. Check back soon!'}
        </p>
        ${isAdmin ? `
          <button class="btn btn-primary" id="btn-generate-draft-empty">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"></path></svg>
            <span>Generate Draft Roster for ${MONTH_NAMES[selectedMonth - 1]}</span>
          </button>
        ` : ''}
      </div>
    `}
  `;

  // Attach Month Handlers
  document.getElementById('btn-prev-month')?.addEventListener('click', () => {
    if (selectedMonth === 1) {
      setState({ selectedMonth: 12, selectedYear: selectedYear - 1 });
    } else {
      setState({ selectedMonth: selectedMonth - 1 });
    }
    window.dispatchEvent(new CustomEvent('app:load-roster'));
  });

  document.getElementById('btn-next-month')?.addEventListener('click', () => {
    if (selectedMonth === 12) {
      setState({ selectedMonth: 1, selectedYear: selectedYear + 1 });
    } else {
      setState({ selectedMonth: selectedMonth + 1 });
    }
    window.dispatchEvent(new CustomEvent('app:load-roster'));
  });

  if (isAdmin) {
    const triggerGenerate = async () => {
      try {
        setState({ loading: true, error: null });
        const res = await api.roster.generate(selectedYear, selectedMonth);
        showToast('Draft roster generated successfully!');
        setState({ currentRoster: res.roster, loading: false });
      } catch (err) {
        setState({ error: err.message, loading: false });
        showToast(err.message, 'error');
      }
    };

    document.getElementById('btn-generate-draft')?.addEventListener('click', triggerGenerate);
    document.getElementById('btn-generate-draft-empty')?.addEventListener('click', triggerGenerate);

    document.getElementById('btn-publish-roster')?.addEventListener('click', async () => {
      if (!currentRoster) return;
      if (!window.confirm('Are you sure you want to publish this roster? Published rosters are finalized for staff.')) return;

      try {
        setState({ loading: true });
        const res = await api.roster.publish(currentRoster._id);
        triggerConfetti();
        showToast('Roster published successfully! 🎉');
        setState({ currentRoster: res.roster, loading: false });
      } catch (err) {
        setState({ error: err.message, loading: false });
        showToast(err.message, 'error');
      }
    });

    if (isDraft) {
      container.querySelectorAll('.shift-card').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('a')) return;
          const idx = Number(card.getAttribute('data-shift-idx'));
          const shift = currentRoster.shifts[idx];
          if (shift) {
            openShiftEditModal(shift, staffList, approvedLeaves, async (shiftDate, newStaffIds) => {
              try {
                const updatedShifts = currentRoster.shifts.map((s) => {
                  const sDate = new Date(s.date).toISOString().split('T')[0];
                  const tDate = new Date(shiftDate).toISOString().split('T')[0];
                  if (sDate === tDate) {
                    return { date: s.date, assignedStaff: newStaffIds };
                  }
                  return {
                    date: s.date,
                    assignedStaff: s.assignedStaff.map((st) => (typeof st === 'object' ? st._id : st))
                  };
                });

                await api.roster.update(currentRoster._id, updatedShifts);
                showToast('Shift updated successfully!');
                const rePop = await api.roster.getByMonth(selectedYear, selectedMonth);
                setState({ currentRoster: rePop });
              } catch (err) {
                showToast(err.message, 'error');
              }
            });
          }
        });
      });
    }
  }

  document.getElementById('btn-share-whatsapp')?.addEventListener('click', () => {
    if (currentRoster) openWhatsAppModal(currentRoster);
  });

  document.getElementById('btn-print-roster')?.addEventListener('click', () => {
    window.print();
  });
}
