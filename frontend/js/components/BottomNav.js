import { state, setState } from '../state.js';

export function renderBottomNav() {
  const el = document.getElementById('bottom-nav');
  if (!el) return;

  const { activeTab, isAdmin, isLoggedIn } = state;

  if (!isLoggedIn) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'flex';

  const tabs = [
    {
      id: 'roster',
      label: isAdmin ? 'Roster' : 'My Shifts',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
    },
    {
      id: 'leaves',
      label: isAdmin ? 'Leaves' : 'My Leave',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`
    },
    {
      id: 'staff',
      label: isAdmin ? 'Staff' : 'Directory',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
    }
  ];

  if (isAdmin) {
    tabs.push({
      id: 'analytics',
      label: 'Stats',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`
    });
  }

  el.innerHTML = tabs
    .map(
      (t) => `
    <button class="mobile-nav-btn ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}" aria-label="${t.label}">
      ${t.icon}
      <span>${t.label}</span>
    </button>
  `
    )
    .join('');

  el.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      if (tab) setState({ activeTab: tab });
    });
  });
}
