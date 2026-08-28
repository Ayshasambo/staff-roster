import { state, setState } from '../state.js';
import { api } from '../api.js';
import { formatDisplayDate, generateWhatsAppRosterText, showToast } from '../utils.js';

const modalContainer = () => document.getElementById('modal-container');

function closeModal() {
  const container = modalContainer();
  if (container) container.innerHTML = '';
}

/**
 * 1. PWA Install Guidance Modal
 */
export function openInstallModal() {
  const container = modalContainer();
  if (!container) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const canDirectPrompt = Boolean(state.deferredInstallPrompt);

  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="stat-icon" style="width: 38px; height: 38px; border-radius: var(--radius-md);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            </div>
            <div>
              <h3 style="font-size: 1.125rem;">Install Staff Roster App</h3>
              <p style="font-size: 0.75rem; color: var(--gray-500);">Direct installation • No App Store needed</p>
            </div>
          </div>
          <button class="btn-icon" id="modal-close-btn" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <div style="background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--radius-lg); padding: 0.875rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.75rem;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <div style="font-size: 0.8125rem; color: var(--green-800);">
              <strong>Works Offline & Fast:</strong> Enjoy a full-screen, standalone app experience with 0 store downloads or fees.
            </div>
          </div>

          ${isIOS ? `
            <div>
              <h4 style="font-size: 0.9375rem; margin-bottom: 0.75rem; color: var(--gray-800);">How to install on iOS Safari:</h4>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; background: var(--gray-50); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--gray-200);">
                  <div class="staff-avatar" style="background: var(--gray-700);">1</div>
                  <div style="font-size: 0.8125rem; color: var(--gray-800);">
                    Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; background: var(--gray-50); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--gray-200);">
                  <div class="staff-avatar" style="background: var(--gray-700);">2</div>
                  <div style="font-size: 0.8125rem; color: var(--gray-800);">
                    Scroll down and tap <strong>"Add to Home Screen"</strong> (+).
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; background: var(--gray-50); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--gray-200);">
                  <div class="staff-avatar" style="background: var(--gray-700);">3</div>
                  <div style="font-size: 0.8125rem; color: var(--gray-800);">
                    Tap <strong>"Add"</strong>. The app icon will now appear on your home screen!
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <div>
              <h4 style="font-size: 0.9375rem; margin-bottom: 0.75rem; color: var(--gray-800);">Android & Desktop (Chrome / Edge):</h4>
              ${canDirectPrompt ? `
                <p style="font-size: 0.8125rem; color: var(--gray-600); margin-bottom: 1rem;">
                  Click the button below to add Staff Roster to your device right away.
                </p>
                <button class="btn btn-primary" id="btn-trigger-install" style="width: 100%; padding: 0.75rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span>Install App Now</span>
                </button>
              ` : `
                <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--gray-200); font-size: 0.8125rem; color: var(--gray-700);">
                  Open your browser menu (⋮) and choose <strong>"Install Staff Roster"</strong> or <strong>"Add to Home screen"</strong>.
                </div>
              `}
            </div>
          `}
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-btn-dismiss">Close</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-btn-dismiss')?.addEventListener('click', closeModal);

  document.getElementById('btn-trigger-install')?.addEventListener('click', async () => {
    if (state.deferredInstallPrompt) {
      state.deferredInstallPrompt.prompt();
      const choice = await state.deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('App installed successfully!');
      }
      setState({ deferredInstallPrompt: null });
      closeModal();
    }
  });
}

/**
 * 2. WhatsApp Roster Share Modal
 */
export function openWhatsAppModal(roster) {
  const container = modalContainer();
  if (!container || !roster) return;

  const rosterText = generateWhatsAppRosterText(roster);

  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="stat-icon" style="width: 38px; height: 38px; background: var(--green-50); color: var(--green-700);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </div>
            <div>
              <h3 style="font-size: 1.125rem;">Share Roster via WhatsApp</h3>
              <p style="font-size: 0.75rem; color: var(--gray-500);">Formatted schedule for staff group chats</p>
            </div>
          </div>
          <button class="btn-icon" id="modal-close-btn" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Message Preview:</label>
            <textarea
              class="form-textarea"
              id="wa-text-area"
              rows="9"
              readonly
              style="font-family: monospace; font-size: 0.8125rem; background: var(--gray-50); line-height: 1.4; white-space: pre-wrap;"
            >${rosterText}</textarea>
          </div>
        </div>

        <div class="modal-footer" style="justify-content: space-between;">
          <button class="btn btn-secondary btn-sm" id="btn-copy-wa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy Text</span>
          </button>
          <button class="btn btn-primary btn-sm" id="btn-open-wa">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            <span>Share to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);

  document.getElementById('btn-copy-wa')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(rosterText);
      showToast('Roster text copied to clipboard!');
    } catch {
      const ta = document.getElementById('wa-text-area');
      ta.select();
      document.execCommand('copy');
      showToast('Roster text copied!');
    }
  });

  document.getElementById('btn-open-wa')?.addEventListener('click', () => {
    const encoded = encodeURIComponent(rosterText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  });
}

/**
 * 3. Shift Customization Modal
 */
export function openShiftEditModal(shift, allStaff, approvedLeaves, onSave) {
  const container = modalContainer();
  if (!container || !shift) return;

  const currentIds = (shift.assignedStaff || []).map((s) => (typeof s === 'object' ? s._id : s));
  let staff1 = currentIds[0] || '';
  let staff2 = currentIds[1] || '';

  const shiftDate = new Date(shift.date);
  shiftDate.setHours(0, 0, 0, 0);

  const isStaffOnLeave = (staffId) => {
    if (!staffId || !approvedLeaves) return false;
    return approvedLeaves.some((l) => {
      const lStaffId = typeof l.staffId === 'object' ? l.staffId._id : l.staffId;
      if (lStaffId !== staffId) return false;
      const sDate = new Date(l.startDate);
      const eDate = new Date(l.endDate);
      sDate.setHours(0, 0, 0, 0);
      eDate.setHours(0, 0, 0, 0);
      return shiftDate >= sDate && shiftDate <= eDate;
    });
  };

  const activeStaff = allStaff.filter((s) => s.active);

  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="stat-icon" style="width: 38px; height: 38px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
            </div>
            <div>
              <h3 style="font-size: 1.125rem;">Edit Shift Assignment</h3>
              <p style="font-size: 0.75rem; color: var(--gray-500);">${formatDisplayDate(shift.date)}</p>
            </div>
          </div>
          <button class="btn-icon" id="modal-close-btn" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <div id="modal-shift-error" style="display: none; background: var(--red-50); border: 1px solid var(--red-100); border-radius: var(--radius-md); padding: 0.75rem; color: var(--red-700); font-size: 0.8125rem; margin-bottom: 1rem;"></div>

          <div class="form-group">
            <label class="form-label">First Assigned Staff:</label>
            <select class="form-select" id="select-staff-1">
              <option value="">-- Select Staff 1 --</option>
              ${activeStaff.map((s) => `
                <option value="${s._id}" ${s._id === staff1 ? 'selected' : ''}>
                  ${s.name} (${s.phonenumber}) ${isStaffOnLeave(s._id) ? '⚠️ [On Leave]' : ''}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Second Assigned Staff:</label>
            <select class="form-select" id="select-staff-2">
              <option value="">-- Select Staff 2 --</option>
              ${activeStaff.map((s) => `
                <option value="${s._id}" ${s._id === staff2 ? 'selected' : ''}>
                  ${s.name} (${s.phonenumber}) ${isStaffOnLeave(s._id) ? '⚠️ [On Leave]' : ''}
                </option>
              `).join('')}
            </select>
          </div>

          <div style="background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.75rem; color: var(--gray-600);">
            💡 <strong>Roster Rule:</strong> Every shift must have exactly 2 distinct active staff members.
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="modal-btn-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="modal-btn-save-shift">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Save Assignment</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-btn-cancel')?.addEventListener('click', closeModal);

  document.getElementById('modal-btn-save-shift')?.addEventListener('click', () => {
    const s1 = document.getElementById('select-staff-1').value;
    const s2 = document.getElementById('select-staff-2').value;
    const errBox = document.getElementById('modal-shift-error');

    if (!s1 || !s2) {
      errBox.style.display = 'block';
      errBox.innerText = 'Please select 2 staff members.';
      return;
    }
    if (s1 === s2) {
      errBox.style.display = 'block';
      errBox.innerText = 'Staff 1 and Staff 2 must be different people.';
      return;
    }

    onSave(shift.date, [s1, s2]);
    closeModal();
  });
}

/**
 * 4. Staff Member Modal (Admin only)
 */
export function openStaffModal(staffToEdit, onSave) {
  const container = modalContainer();
  if (!container) return;

  const isEdit = Boolean(staffToEdit);

  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="stat-icon" style="width: 38px; height: 38px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div>
              <h3 style="font-size: 1.125rem;">${isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}</h3>
              <p style="font-size: 0.75rem; color: var(--gray-500);">${isEdit ? 'Update employee profile' : 'Create a staff record'}</p>
            </div>
          </div>
          <button class="btn-icon" id="modal-close-btn" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <div id="modal-staff-error" style="display: none; background: var(--red-50); border: 1px solid var(--red-100); border-radius: var(--radius-md); padding: 0.75rem; color: var(--red-700); font-size: 0.8125rem; margin-bottom: 1rem;"></div>

          <div class="form-group">
            <label class="form-label" for="staff-name">Full Name:</label>
            <input type="text" class="form-input" id="staff-name" placeholder="e.g. Aysha Sambo" value="${staffToEdit?.name || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="staff-phone">Phone Number (Numeric):</label>
            <input type="number" class="form-input" id="staff-phone" placeholder="e.g. 9029794213" value="${staffToEdit?.phonenumber || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="staff-role">Role:</label>
            <select class="form-select" id="staff-role">
              <option value="staff" ${staffToEdit?.role === 'staff' ? 'selected' : ''}>Staff Member</option>
              <option value="admin" ${staffToEdit?.role === 'admin' ? 'selected' : ''}>Administrator (Manager)</option>
            </select>
          </div>

          ${!isEdit ? `
            <div class="form-group">
              <label class="form-label" for="staff-leave-balance">Starting Leave Balance (Days):</label>
              <input type="number" class="form-input" id="staff-leave-balance" value="30" min="0" max="90" />
            </div>
          ` : ''}
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="modal-btn-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="modal-btn-save-staff">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${isEdit ? 'Update Details' : 'Add Staff'}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-btn-cancel')?.addEventListener('click', closeModal);

  document.getElementById('modal-btn-save-staff')?.addEventListener('click', async () => {
    const name = document.getElementById('staff-name').value.trim();
    const phone = document.getElementById('staff-phone').value.trim();
    const role = document.getElementById('staff-role').value;
    const errBox = document.getElementById('modal-staff-error');

    if (!name || !phone) {
      errBox.style.display = 'block';
      errBox.innerText = 'Name and phone number are required.';
      return;
    }

    try {
      const payload = {
        name,
        phonenumber: Number(phone),
        role
      };
      if (!isEdit) {
        payload.leaveBalance = Number(document.getElementById('staff-leave-balance').value || 30);
      }
      await onSave(payload, staffToEdit?._id);
      closeModal();
    } catch (err) {
      errBox.style.display = 'block';
      errBox.innerText = err.message || 'Failed to save staff member.';
    }
  });
}

/**
 * 5. Leave Request Modal (Personalized for Staff)
 */
export function openLeaveModal(allStaff, onSave) {
  const container = modalContainer();
  if (!container) return;

  const { currentUser, isAdmin } = state;
  const today = new Date().toISOString().split('T')[0];
  const activeStaff = allStaff.filter((s) => s.active);

  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="stat-icon" style="width: 38px; height: 38px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </div>
            <div>
              <h3 style="font-size: 1.125rem;">Apply for Leave</h3>
              <p style="font-size: 0.75rem; color: var(--gray-500);">Submit a time-off request</p>
            </div>
          </div>
          <button class="btn-icon" id="modal-close-btn" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <div id="modal-leave-error" style="display: none; background: var(--red-50); border: 1px solid var(--red-100); border-radius: var(--radius-md); padding: 0.75rem; color: var(--red-700); font-size: 0.8125rem; margin-bottom: 1rem;"></div>

          <div class="form-group">
            <label class="form-label" for="leave-staff-select">Applicant:</label>
            ${isAdmin ? `
              <select class="form-select" id="leave-staff-select">
                <option value="">-- Choose Employee --</option>
                ${activeStaff.map((s) => `
                  <option value="${s._id}" ${s._id === currentUser?._id ? 'selected' : ''}>
                    ${s.name} (Balance: ${s.leaveBalance} days remaining)
                  </option>
                `).join('')}
              </select>
            ` : `
              <input
                type="text"
                class="form-input"
                value="${currentUser?.name || ''} (Balance: ${currentUser?.leaveBalance} days)"
                disabled
                style="background: var(--gray-100); font-weight: 600;"
              />
              <input type="hidden" id="leave-staff-select" value="${currentUser?._id}" />
            `}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="leave-start-date">Start Date:</label>
              <input type="date" class="form-input" id="leave-start-date" value="${today}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="leave-end-date">End Date:</label>
              <input type="date" class="form-input" id="leave-end-date" value="${today}" />
            </div>
          </div>

          <div style="background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--radius-md); padding: 0.875rem 1rem; margin-top: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.75rem; color: var(--green-800); font-weight: 600;">Calculated Working Days:</div>
              <div style="font-size: 0.6875rem; color: var(--gray-600);">Mon-Fri only (Weekends excluded)</div>
            </div>
            <div id="leave-working-days-calc" style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: var(--green-800);">
              1 day
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="modal-btn-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="modal-btn-submit-leave">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Submit Request</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const sSelect = document.getElementById('leave-staff-select');
  const sStart = document.getElementById('leave-start-date');
  const sEnd = document.getElementById('leave-end-date');
  const daysCalc = document.getElementById('leave-working-days-calc');

  // Self-contained working days counter (Mon-Fri only)
  function countWorkingDays(startStr, endStr) {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (start > end) return 0;
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const d = cur.getDay();
      if (d >= 1 && d <= 5) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  function updateDays() {
    const wDays = countWorkingDays(sStart.value, sEnd.value);
    daysCalc.innerText = `${wDays} ${wDays === 1 ? 'day' : 'days'}`;
  }

  sStart.addEventListener('change', updateDays);
  sEnd.addEventListener('change', updateDays);
  updateDays();

  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-btn-cancel')?.addEventListener('click', closeModal);

  document.getElementById('modal-btn-submit-leave')?.addEventListener('click', async () => {
    const staffId = sSelect.value;
    const startDate = sStart.value;
    const endDate = sEnd.value;
    const errBox = document.getElementById('modal-leave-error');

    if (!staffId || !startDate || !endDate) {
      errBox.style.display = 'block';
      errBox.innerText = 'All fields are required.';
      return;
    }

    const workingDays = countWorkingDays(startDate, endDate);
    if (workingDays < 1) {
      errBox.style.display = 'block';
      errBox.innerText = 'Leave period must include at least 1 working day (Monday to Friday).';
      return;
    }

    try {
      await onSave({ staffId, startDate, endDate });
      closeModal();
    } catch (err) {
      errBox.style.display = 'block';
      errBox.innerText = err.message || 'Failed to submit leave request.';
    }
  });
}

/**
 * 6. Change PIN Modal
 */
export function openChangePinModal() {
  const container = modalContainer();
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="stat-icon" style="width: 38px; height: 38px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <div>
              <h3 style="font-size: 1.125rem;">Change 4-Digit PIN</h3>
              <p style="font-size: 0.75rem; color: var(--gray-500);">Update your security passcode</p>
            </div>
          </div>
          <button class="btn-icon" id="modal-close-btn" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="modal-body">
          <div id="modal-pin-error" style="display: none; background: var(--red-50); border: 1px solid var(--red-100); border-radius: var(--radius-md); padding: 0.75rem; color: var(--red-700); font-size: 0.8125rem; margin-bottom: 1rem;"></div>

          <div class="form-group">
            <label class="form-label" for="current-pin">Current PIN:</label>
            <input type="password" class="form-input" id="current-pin" placeholder="••••" maxlength="8" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="new-pin">New 4-Digit PIN:</label>
            <input type="password" class="form-input" id="new-pin" placeholder="••••" maxlength="8" required />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="modal-btn-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="modal-btn-save-pin">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Update PIN</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-btn-cancel')?.addEventListener('click', closeModal);

  document.getElementById('modal-btn-save-pin')?.addEventListener('click', async () => {
    const currentPin = document.getElementById('current-pin').value.trim();
    const newPin = document.getElementById('new-pin').value.trim();
    const errBox = document.getElementById('modal-pin-error');

    if (!newPin || newPin.length < 4) {
      errBox.style.display = 'block';
      errBox.innerText = 'New PIN must be at least 4 digits.';
      return;
    }

    try {
      await api.auth.changePin(currentPin, newPin);
      showToast('PIN updated successfully!');
      closeModal();
    } catch (err) {
      errBox.style.display = 'block';
      errBox.innerText = err.message || 'Failed to update PIN.';
    }
  });
}
