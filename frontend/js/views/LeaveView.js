import { state, setState } from '../state.js';
import { api } from '../api.js';
import { formatDisplayDate, showToast, triggerConfetti } from '../utils.js';
import { openLeaveModal } from '../components/Modals.js';

export function renderLeaveView(container) {
  const { leavesList, staffList, currentUser, isAdmin } = state;

  // Filter leaves depending on role
  const displayLeaves = isAdmin
    ? leavesList
    : leavesList.filter((l) => {
        const sId = typeof l.staffId === 'object' && l.staffId !== null ? l.staffId._id : l.staffId;
        return sId === currentUser?._id;
      });

  const totalLeaves = displayLeaves.length;
  const pendingLeaves = displayLeaves.filter((l) => l.status === 'pending').length;
  const approvedLeaves = displayLeaves.filter((l) => l.status === 'approved').length;
  const rejectedLeaves = displayLeaves.filter((l) => l.status === 'rejected').length;

  container.innerHTML = `
    <!-- Top Personal Balance & Stats Row -->
    <div class="stats-grid">
      <div class="stat-card" style="background: linear-gradient(135deg, var(--white), var(--green-50)); border-color: var(--green-200);">
        <div class="stat-icon" style="background: var(--green-600); color: var(--white); box-shadow: var(--shadow-green);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value" style="color: var(--green-800);">${currentUser?.leaveBalance !== undefined ? currentUser.leaveBalance : 30}</span>
          <span class="stat-label" style="color: var(--green-900); font-weight: 600;">Your Remaining Days</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--amber-50); color: var(--amber-700);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">${pendingLeaves}</span>
          <span class="stat-label">Pending Approval</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">${approvedLeaves}</span>
          <span class="stat-label">Approved Leaves</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--gray-100); color: var(--gray-700);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">${totalLeaves}</span>
          <span class="stat-label">${isAdmin ? 'All Applications' : 'My Applications'}</span>
        </div>
      </div>
    </div>

    <!-- Actions & Filter Bar -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
        <!-- Status Filter Tabs -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm leave-filter-btn active" data-filter="all">
            All (${totalLeaves})
          </button>
          <button class="btn btn-secondary btn-sm leave-filter-btn" data-filter="pending">
            Pending (${pendingLeaves})
          </button>
          <button class="btn btn-secondary btn-sm leave-filter-btn" data-filter="approved">
            Approved (${approvedLeaves})
          </button>
          <button class="btn btn-secondary btn-sm leave-filter-btn" data-filter="rejected">
            Rejected (${rejectedLeaves})
          </button>
        </div>

        <button class="btn btn-primary" id="btn-apply-leave">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Apply for Leave</span>
        </button>
      </div>
    </div>

    <!-- Leaves Table Container -->
    <div class="table-container">
      <table class="app-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Leave Period</th>
            <th>Working Days</th>
            <th>Status</th>
            <th style="text-align: right;">${isAdmin ? 'Approval Action' : 'Application Status'}</th>
          </tr>
        </thead>
        <tbody id="leaves-table-body">
          ${displayLeaves.length === 0 ? `
            <tr>
              <td colspan="5" style="text-align: center; padding: 3rem 1rem; color: var(--gray-500);">
                <div style="margin-bottom: 0.5rem;">🏖️ No leave applications recorded.</div>
                <div style="font-size: 0.75rem;">Click "Apply for Leave" above to request time off.</div>
              </td>
            </tr>
          ` : displayLeaves.map((leave) => {
            const staff = typeof leave.staffId === 'object' && leave.staffId !== null ? leave.staffId : null;
            const staffName = staff ? staff.name : (currentUser?.name || 'Staff');
            const staffBalance = staff ? staff.leaveBalance : currentUser?.leaveBalance;
            const sId = staff ? staff._id : leave.staffId;
            const isMe = sId === currentUser?._id;
            const initials = staffName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

            const isPending = leave.status === 'pending';
            const isApproved = leave.status === 'approved';
            const isRejected = leave.status === 'rejected';

            return `
              <tr data-leave-status="${leave.status}">
                <td>
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div class="staff-avatar" style="background: ${isMe ? 'var(--green-700)' : 'var(--green-600)'};">${initials}</div>
                    <div>
                      <strong style="color: var(--gray-900);">${staffName} ${isMe && !isAdmin ? '<span style="color: var(--green-800);">(You)</span>' : ''}</strong>
                      <div style="font-size: 0.6875rem; color: var(--gray-500);">
                        Balance: ${staffBalance !== undefined ? staffBalance : 30} days
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; color: var(--gray-800);">
                    ${formatDisplayDate(leave.startDate)} → ${formatDisplayDate(leave.endDate)}
                  </div>
                </td>
                <td>
                  <span style="font-weight: 700; color: var(--green-800);">
                    ${leave.workingDays} ${leave.workingDays === 1 ? 'day' : 'days'}
                  </span>
                </td>
                <td>
                  <span class="badge ${isApproved ? 'badge-green' : isPending ? 'badge-amber' : 'badge-red'}">
                    ${isApproved ? '● Approved' : isPending ? '● Pending' : '● Rejected'}
                  </span>
                </td>
                <td style="text-align: right;">
                  ${isAdmin && isPending ? `
                    <div style="display: inline-flex; gap: 0.5rem;">
                      <button class="btn btn-outline-green btn-sm btn-approve-leave" data-id="${leave._id}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Approve</span>
                      </button>
                      <button class="btn btn-danger btn-sm btn-reject-leave" data-id="${leave._id}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        <span>Reject</span>
                      </button>
                    </div>
                  ` : `
                    <span style="font-size: 0.75rem; color: var(--gray-500); font-style: italic;">
                      ${isApproved ? 'Approved by Admin' : isPending ? 'Awaiting Manager Review' : 'Rejected'}
                    </span>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Status Filter Trigger
  container.querySelectorAll('.leave-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.leave-filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      container.querySelectorAll('#leaves-table-body tr').forEach((row) => {
        const rowStatus = row.getAttribute('data-leave-status');
        if (filter === 'all' || rowStatus === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });

  // Apply for Leave Trigger
  document.getElementById('btn-apply-leave')?.addEventListener('click', () => {
    openLeaveModal(staffList, async (data) => {
      await api.leaves.create(data);
      showToast('Leave application submitted successfully!');
      window.dispatchEvent(new CustomEvent('app:load-leaves'));
      window.dispatchEvent(new CustomEvent('app:load-staff'));
    });
  });

  if (isAdmin) {
    // Approve Leave Trigger
    container.querySelectorAll('.btn-approve-leave').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          await api.leaves.approve(id);
          triggerConfetti();
          showToast('Leave approved! Staff balance updated.');
          window.dispatchEvent(new CustomEvent('app:load-leaves'));
          window.dispatchEvent(new CustomEvent('app:load-staff'));
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Reject Leave Trigger
    container.querySelectorAll('.btn-reject-leave').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!window.confirm('Reject this leave request?')) return;
        try {
          await api.leaves.reject(id);
          showToast('Leave request rejected.');
          window.dispatchEvent(new CustomEvent('app:load-leaves'));
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  }
}
