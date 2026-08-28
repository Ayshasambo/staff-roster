import { state } from '../state.js';

export function renderAnalyticsView(container) {
  const { allRosters, staffList } = state;

  const publishedRosters = allRosters.filter((r) => r.status === 'published');
  const activeStaff = staffList.filter((s) => s.active);

  // Count shifts assigned per staff member
  const shiftCounts = {};
  activeStaff.forEach((s) => {
    shiftCounts[s._id] = 0;
  });

  publishedRosters.forEach((roster) => {
    (roster.shifts || []).forEach((shift) => {
      (shift.assignedStaff || []).forEach((staff) => {
        const id = typeof staff === 'object' && staff !== null ? staff._id : staff;
        if (shiftCounts[id] !== undefined) {
          shiftCounts[id]++;
        }
      });
    });
  });

  const maxShifts = Math.max(1, ...Object.values(shiftCounts));
  const totalPublishedShifts = publishedRosters.reduce((acc, r) => acc + (r.shifts?.length || 0), 0);

  container.innerHTML = `
    <!-- Stats Row -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">${publishedRosters.length}</span>
          <span class="stat-label">Published Rosters</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--gray-100); color: var(--gray-700);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">${totalPublishedShifts}</span>
          <span class="stat-label">Total Shifts Completed</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">${activeStaff.length}</span>
          <span class="stat-label">Pool of Active Staff</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: var(--green-50); color: var(--green-700);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">${activeStaff.length > 0 ? ((totalPublishedShifts * 2) / activeStaff.length).toFixed(1) : 0}</span>
          <span class="stat-label">Avg Shifts / Staff</span>
        </div>
      </div>
    </div>

    <!-- Shift Workload Balance Breakdown -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <div>
          <h3 style="font-size: 1.125rem;">Shift Fairness & Workload Distribution</h3>
          <p style="font-size: 0.75rem; color: var(--gray-500);">
            Historical shifts across all finalized rosters to ensure no staff member is overworked
          </p>
        </div>
        <span class="badge badge-green">
          ⚖️ Balanced Algorithm
        </span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
        ${activeStaff.length === 0 ? `
          <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
            No active staff members found.
          </div>
        ` : activeStaff.map((staff) => {
          const count = shiftCounts[staff._id] || 0;
          const percentage = Math.round((count / maxShifts) * 100);
          const initials = staff.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

          return `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <div class="staff-avatar" style="width: 24px; height: 24px; font-size: 0.625rem;">${initials}</div>
                  <span style="font-weight: 600; color: var(--gray-800); font-size: 0.875rem;">${staff.name}</span>
                </div>
                <span style="font-weight: 700; color: var(--green-800); font-size: 0.8125rem;">
                  ${count} ${count === 1 ? 'shift' : 'shifts'}
                </span>
              </div>
              <div style="background: var(--gray-100); border-radius: var(--radius-full); height: 10px; overflow: hidden; border: 1px solid var(--gray-200);">
                <div style="background: linear-gradient(90deg, var(--green-500), var(--green-600)); height: 100%; width: ${Math.max(4, percentage)}%; border-radius: var(--radius-full); transition: width 400ms ease;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Rostering Rules Reference -->
    <div class="card">
      <div class="card-header">
        <h3 style="font-size: 1.125rem;">Automated Scheduling Rules</h3>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
        <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--gray-200);">
          <div style="font-weight: 700; color: var(--gray-900); margin-bottom: 0.25rem;">
            📅 Monday to Thursday Only
          </div>
          <div style="font-size: 0.75rem; color: var(--gray-600);">
            Roster shifts are strictly generated for weekdays from Monday through Thursday.
          </div>
        </div>

        <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--gray-200);">
          <div style="font-weight: 700; color: var(--gray-900); margin-bottom: 0.25rem;">
            👥 2 Staff Members Per Shift
          </div>
          <div style="font-size: 0.75rem; color: var(--gray-600);">
            Every roster shift requires exactly two distinct, active team members assigned.
          </div>
        </div>

        <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--gray-200);">
          <div style="font-weight: 700; color: var(--gray-900); margin-bottom: 0.25rem;">
            🏖️ Approved Leave Respect
          </div>
          <div style="font-size: 0.75rem; color: var(--gray-600);">
            Staff on approved leave are automatically excluded from shifts during their vacation period.
          </div>
        </div>

        <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--gray-200);">
          <div style="font-weight: 700; color: var(--gray-900); margin-bottom: 0.25rem;">
            🔄 Dynamic Fair Pairing
          </div>
          <div style="font-size: 0.75rem; color: var(--gray-600);">
            The algorithm minimizes repeating pairs and balances historical shifts across all team members.
          </div>
        </div>
      </div>
    </div>
  `;
}
