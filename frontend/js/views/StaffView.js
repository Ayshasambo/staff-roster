import { state, setState } from '../state.js';
import { api } from '../api.js';
import { showToast } from '../utils.js';
import { openStaffModal } from '../components/Modals.js';

export function renderStaffView(container) {
  const { staffList, isAdmin, currentUser } = state;

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.active).length;
  const inactiveStaff = totalStaff - activeStaff;
  const totalLeavePool = staffList.reduce((acc, s) => acc + (s.leaveBalance || 0), 0);

  container.innerHTML = `
    <!-- Stats Row (Admin only or simplified for staff) -->
    ${isAdmin ? `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">${activeStaff}</span>
            <span class="stat-label">Active Team Members</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: var(--gray-100); color: var(--gray-700);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">${totalLeavePool}</span>
            <span class="stat-label">Total Leave Pool (Days)</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">${totalStaff > 0 ? (totalLeavePool / totalStaff).toFixed(1) : '30'}</span>
            <span class="stat-label">Avg Balance / Staff</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: ${inactiveStaff > 0 ? 'var(--amber-50)' : 'var(--gray-100)'}; color: ${inactiveStaff > 0 ? 'var(--amber-700)' : 'var(--gray-600)'};">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">${inactiveStaff}</span>
            <span class="stat-label">Inactive Members</span>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Actions & Filter Bar -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 240px;">
          <input
            type="text"
            id="staff-search-input"
            class="form-input"
            placeholder="Search team members by name or phone..."
            style="max-width: 360px;"
          />
        </div>

        ${isAdmin ? `
          <button class="btn btn-primary" id="btn-add-staff">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Add Staff Member</span>
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Staff Table Container -->
    <div class="table-container">
      <table class="app-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Phone Number</th>
            <th>Role</th>
            ${isAdmin ? `<th>Leave Balance</th><th>Status</th>` : ''}
            <th style="text-align: right;">${isAdmin ? 'Management' : 'Contact'}</th>
          </tr>
        </thead>
        <tbody id="staff-table-body">
          ${staffList.map((staff) => {
            const isMe = staff._id === currentUser?._id;
            const initials = staff.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            const isStaffAdmin = staff.role === 'admin';

            return `
              <tr data-staff-id="${staff._id}">
                <td>
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div class="staff-avatar" style="background: ${isMe ? 'var(--green-700)' : 'var(--green-600)'};">${initials}</div>
                    <div>
                      <strong style="color: var(--gray-900);">${staff.name}</strong>
                      ${isMe ? '<span style="color: var(--green-800); font-size: 0.75rem; font-weight: 700; margin-left: 4px;">(You)</span>' : ''}
                    </div>
                  </div>
                </td>
                <td>
                  <a href="tel:${staff.phonenumber}" style="color: var(--green-700); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span>${staff.phonenumber}</span>
                  </a>
                </td>
                <td>
                  <span class="badge ${isStaffAdmin ? 'badge-green' : 'badge-gray'}">
                    ${isStaffAdmin ? '👑 Admin' : 'Staff'}
                  </span>
                </td>
                ${isAdmin ? `
                  <td>
                    <span class="badge ${staff.leaveBalance > 10 ? 'badge-green' : staff.leaveBalance > 0 ? 'badge-amber' : 'badge-red'}">
                      ${staff.leaveBalance} days left
                    </span>
                  </td>
                  <td>
                    <span class="badge ${staff.active ? 'badge-green' : 'badge-gray'}">
                      ${staff.active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                ` : ''}
                <td style="text-align: right;">
                  ${isAdmin ? `
                    <div style="display: inline-flex; gap: 0.5rem;">
                      <button class="btn btn-secondary btn-sm btn-edit-staff" data-id="${staff._id}" title="Edit Profile">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      ${staff.active ? `
                        <button class="btn btn-danger btn-sm btn-deactivate-staff" data-id="${staff._id}" title="Deactivate">
                          Deactivate
                        </button>
                      ` : `
                        <button class="btn btn-outline-green btn-sm btn-activate-staff" data-id="${staff._id}" title="Reactivate">
                          Reactivate
                        </button>
                      `}
                    </div>
                  ` : `
                    <a href="tel:${staff.phonenumber}" class="btn btn-outline-green btn-sm">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <span>Call</span>
                    </a>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Search Filter Handler
  const searchInput = document.getElementById('staff-search-input');
  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    container.querySelectorAll('#staff-table-body tr').forEach((row) => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });

  if (isAdmin) {
    // Add Staff Modal Trigger
    document.getElementById('btn-add-staff')?.addEventListener('click', () => {
      openStaffModal(null, async (data) => {
        await api.staff.create(data);
        showToast('Staff member added successfully!');
        window.dispatchEvent(new CustomEvent('app:load-staff'));
      });
    });

    // Edit Staff Modal Triggers
    container.querySelectorAll('.btn-edit-staff').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const staff = staffList.find((s) => s._id === id);
        if (staff) {
          openStaffModal(staff, async (data, staffId) => {
            await api.staff.update(staffId, data);
            showToast('Staff details updated!');
            window.dispatchEvent(new CustomEvent('app:load-staff'));
          });
        }
      });
    });

    // Deactivate Handler
    container.querySelectorAll('.btn-deactivate-staff').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!window.confirm('Deactivate this staff member? They will not be scheduled for future shifts.')) return;
        try {
          await api.staff.deactivate(id);
          showToast('Staff deactivated.');
          window.dispatchEvent(new CustomEvent('app:load-staff'));
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Reactivate Handler
    container.querySelectorAll('.btn-activate-staff').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          await api.staff.activate(id);
          showToast('Staff reactivated.');
          window.dispatchEvent(new CustomEvent('app:load-staff'));
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  }
}
