/**
 * Global Reactive State Store with Auth Management
 */

const now = new Date();

// Load cached user/token from localStorage
const storedToken = localStorage.getItem('staff_roster_token');
let storedUser = null;
try {
  const parsed = localStorage.getItem('staff_roster_user');
  if (parsed) storedUser = JSON.parse(parsed);
} catch {}

export const state = {
  // Auth state
  token: storedToken || null,
  currentUser: storedUser || null,
  isLoggedIn: Boolean(storedToken && storedUser),
  isAdmin: Boolean(storedUser && storedUser.role === 'admin'),

  // Navigation & View State
  activeTab: 'roster',
  selectedYear: now.getFullYear(),
  selectedMonth: now.getMonth() + 1,

  // App Data
  currentRoster: null,
  allRosters: [],
  staffList: [],
  leavesList: [],
  myLeavesList: [],
  loading: false,
  error: null,

  // PWA State
  isOnline: navigator.onLine,
  deferredInstallPrompt: null,
  isStandalone: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
  listeners: new Set(),
};

export function subscribe(listener) {
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}

export function setState(partial) {
  Object.assign(state, partial);
  if (partial.currentUser !== undefined) {
    state.isAdmin = Boolean(state.currentUser && state.currentUser.role === 'admin');
    state.isLoggedIn = Boolean(state.token && state.currentUser);
  }
  state.listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.error('State subscriber error:', e);
    }
  });
}

export function setAuth(user, token) {
  localStorage.setItem('staff_roster_token', token);
  localStorage.setItem('staff_roster_user', JSON.stringify(user));
  setState({
    token,
    currentUser: user,
    isLoggedIn: true,
    isAdmin: user.role === 'admin',
    activeTab: 'roster'
  });
}

export function clearAuth() {
  localStorage.removeItem('staff_roster_token');
  localStorage.removeItem('staff_roster_user');
  setState({
    token: null,
    currentUser: null,
    isLoggedIn: false,
    isAdmin: false,
    activeTab: 'roster',
    currentRoster: null,
    staffList: [],
    leavesList: []
  });
}
