/**
 * Main Progressive Web App (PWA) Entrypoint — with Auth Gate
 */

import { state, setState, clearAuth, subscribe } from './state.js';
import { api } from './api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderBottomNav } from './components/BottomNav.js';
import { renderRosterView } from './views/RosterView.js';
import { renderStaffView } from './views/StaffView.js';
import { renderLeaveView } from './views/LeaveView.js';
import { renderAnalyticsView } from './views/AnalyticsView.js';
import { renderLoginView } from './views/LoginView.js';
import { showToast } from './utils.js';

// ── Service Worker (PWA Offline) ─────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('PWA Service Worker registered, scope:', reg.scope);
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
    }
  });
}

// ── PWA Install Prompt ────────────────────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  setState({ deferredInstallPrompt: e });
});

window.addEventListener('appinstalled', () => {
  setState({ deferredInstallPrompt: null, isStandalone: true });
  showToast('Staff Roster installed on your device! 🎉');
});

// ── Connectivity Listeners ────────────────────────────────────────────────────
window.addEventListener('online', () => {
  setState({ isOnline: true });
  const banner = document.getElementById('offline-banner');
  if (banner) banner.style.display = 'none';
  showToast('Back online! Refreshing data…');
  if (state.isLoggedIn) loadAllData();
});

window.addEventListener('offline', () => {
  setState({ isOnline: false });
  const banner = document.getElementById('offline-banner');
  if (banner) banner.style.display = 'flex';
  showToast('You are offline. Showing cached data.', 'error');
});

// ── Auth: Validate stored token on boot ───────────────────────────────────────
async function verifyStoredSession() {
  if (!state.token) return false;
  try {
    const user = await api.auth.me();
    // Refresh user's leave balance from server
    setState({ currentUser: { ...state.currentUser, ...user } });
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

// ── Render Router ─────────────────────────────────────────────────────────────
function renderApp() {
  const viewContainer = document.getElementById('view-container');
  if (!viewContainer) return;

  // Show login screen if not authenticated
  if (!state.isLoggedIn) {
    renderNavbar();
    renderBottomNav();
    renderLoginView(viewContainer);
    return;
  }

  renderNavbar();
  renderBottomNav();

  switch (state.activeTab) {
    case 'roster':
      renderRosterView(viewContainer);
      break;
    case 'staff':
      renderStaffView(viewContainer);
      break;
    case 'leaves':
      renderLeaveView(viewContainer);
      break;
    case 'analytics':
      if (state.isAdmin) {
        renderAnalyticsView(viewContainer);
      } else {
        // Non-admins: fall back to roster
        setState({ activeTab: 'roster' });
      }
      break;
    default:
      renderRosterView(viewContainer);
  }
}

// ── Data Loaders ──────────────────────────────────────────────────────────────
async function loadCurrentRoster() {
  const { selectedYear, selectedMonth } = state;
  try {
    setState({ loading: true, error: null });
    const roster = await api.roster.getByMonth(selectedYear, selectedMonth);
    setState({ currentRoster: roster, loading: false });
  } catch (err) {
    if (err.status === 404) {
      setState({ currentRoster: null, loading: false, error: null });
    } else {
      setState({ currentRoster: null, loading: false, error: err.message });
    }
  }
}

async function loadStaff() {
  try {
    // Admins see all; staff also benefit from full list for roster display
    const staffList = await api.staff.getAll();
    setState({ staffList });

    // Refresh current user's leave balance from the list
    if (state.currentUser) {
      const fresh = staffList.find((s) => s._id === state.currentUser._id);
      if (fresh) {
        setState({ currentUser: { ...state.currentUser, leaveBalance: fresh.leaveBalance } });
      }
    }
  } catch (err) {
    console.error('Failed to load staff:', err);
  }
}

async function loadLeaves() {
  try {
    // Admin gets all leaves; staff only get their own (filtered by staffId)
    const staffId = state.isAdmin ? undefined : state.currentUser?._id;
    const leavesList = await api.leaves.getAll(staffId);
    setState({ leavesList });
  } catch (err) {
    console.error('Failed to load leaves:', err);
  }
}

async function loadAllRosters() {
  try {
    const allRosters = await api.roster.getAll();
    setState({ allRosters });
  } catch (err) {
    console.error('Failed to load all rosters:', err);
  }
}

async function loadAllData() {
  await Promise.all([
    loadStaff(),
    loadLeaves(),
    loadAllRosters(),
    loadCurrentRoster(),
  ]);
}

// ── Custom Event Hooks ────────────────────────────────────────────────────────
window.addEventListener('app:refresh', async () => {
  await loadAllData();
  showToast('Data refreshed.');
});

window.addEventListener('app:load-roster', loadCurrentRoster);
window.addEventListener('app:load-staff', loadStaff);
window.addEventListener('app:load-leaves', loadLeaves);

// After successful login, load data and re-render
window.addEventListener('app:authenticated', async () => {
  await loadAllData();
  renderApp();
});

// After logout (state change triggers re-render via subscriber)
window.addEventListener('app:logout', () => {
  clearAuth();
});

// ── State Subscriber (reactive re-render) ─────────────────────────────────────
subscribe(() => {
  renderApp();
});

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  setState({ isStandalone });

  // Initial render (may show login screen)
  renderApp();

  // Verify stored token validity
  const sessionOk = await verifyStoredSession();

  if (sessionOk) {
    // Load data for authenticated user
    await loadAllData();
    renderApp();
  }
  // If no session, LoginView is already showing from renderApp() above
});
