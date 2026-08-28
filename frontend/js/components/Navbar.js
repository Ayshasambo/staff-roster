import { state, setState, clearAuth } from '../state.js';
import { openInstallModal, openChangePinModal } from './Modals.js';
import { showToast } from '../utils.js';

export function renderNavbar() {
  const el = document.getElementById('navbar');
  if (!el) return;

  const { activeTab, isStandalone, currentUser, isAdmin, isLoggedIn } = state;

  if (!isLoggedIn) {
    el.innerHTML = `
      <div class="navbar-inner">
        <div class="brand-group">
          <div class="brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div class="brand-text">
            <div style="display: flex; align-items: center; gap: 6px;">
              <h1>Staff Roster</h1>
              <span class="brand-badge">Admin Staff</span>
            </div>
          </div>
        </div>
        <div class="nav-actions">
          ${!isStandalone ? `
            <button class="btn btn-primary btn-sm" id="btn-install-app">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              <span>Install App</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
    document.getElementById('btn-install-app')?.addEventListener('click', openInstallModal);
    return;
  }

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  el.innerHTML = `
    <div class="navbar-inner">
      <!-- Brand -->
      <div class="brand-group" id="nav-brand">
        <div class="brand-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div class="brand-text">
          <div style="display: flex; align-items: center; gap: 6px;">
            <h1>Staff Roster</h1>
            <span class="brand-badge">Admin Staff</span>
          </div>
          <span style="font-size: 0.6875rem; color: var(--gray-500); font-weight: 500;">
            ${isAdmin ? 'Manager Portal' : 'Staff Portal'}
          </span>
        </div>
      </div>

      <!-- Desktop Nav Tabs -->
      <nav class="desktop-nav">
        <button class="nav-tab-btn ${activeTab === 'roster' ? 'active' : ''}" data-tab="roster">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${isAdmin ? 'Roster Schedule' : 'My Roster'}</span>
        </button>

        <button class="nav-tab-btn ${activeTab === 'leaves' ? 'active' : ''}" data-tab="leaves">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <span>${isAdmin ? 'Leave Requests' : 'Apply & Leave Balance'}</span>
        </button>

        <button class="nav-tab-btn ${activeTab === 'staff' ? 'active' : ''}" data-tab="staff">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>${isAdmin ? 'Staff Management' : 'Team Directory'}</span>
        </button>

        ${isAdmin ? `
          <button class="nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}" data-tab="analytics">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span>Fairness Stats</span>
          </button>
        ` : ''}
      </nav>

      <!-- User Profile & Action Buttons -->
      <div class="nav-actions">
        <!-- User Chip -->
        <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--gray-100); padding: 4px 10px 4px 4px; border-radius: var(--radius-full); border: 1px solid var(--gray-200);">
          <div class="staff-avatar" style="width: 28px; height: 28px; font-size: 0.6875rem; background: ${isAdmin ? 'var(--green-700)' : 'var(--gray-700)'};">
            ${initials}
          </div>
          <div style="display: flex; flex-direction: column; line-height: 1.1;">
            <span style="font-size: 0.8125rem; font-weight: 700; color: var(--gray-900);">
              ${currentUser?.name || 'Staff'}
            </span>
            <span style="font-size: 0.625rem; font-weight: 700; color: ${isAdmin ? 'var(--green-700)' : 'var(--gray-500)'}; text-transform: uppercase;">
              ${isAdmin ? '👑 Admin' : 'Staff Member'}
            </span>
          </div>
        </div>

        <button class="btn btn-secondary btn-sm btn-icon" id="btn-change-pin" title="Change 4-Digit PIN">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </button>

        <button class="btn btn-secondary btn-sm" id="btn-logout" title="Sign out">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span style="display: none; md: inline;">Exit</span>
        </button>

        ${!isStandalone ? `
          <button class="btn btn-primary btn-sm" id="btn-install-app" title="Install App">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          </button>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('nav-brand')?.addEventListener('click', () => {
    setState({ activeTab: 'roster' });
  });

  el.querySelectorAll('.nav-tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      if (tab) setState({ activeTab: tab });
    });
  });

  document.getElementById('btn-change-pin')?.addEventListener('click', openChangePinModal);

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (window.confirm('Sign out of your staff account?')) {
      clearAuth();
      showToast('Logged out successfully.');
    }
  });

  document.getElementById('btn-install-app')?.addEventListener('click', openInstallModal);
}
