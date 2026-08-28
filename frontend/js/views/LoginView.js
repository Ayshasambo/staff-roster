import { setAuth } from '../state.js';
import { api } from '../api.js';
import { showToast, triggerConfetti } from '../utils.js';
import { openInstallModal } from '../components/Modals.js';

export function renderLoginView(container) {
  container.innerHTML = `
    <div style="max-width: 440px; margin: 2.5rem auto; padding: 0 1rem;">
      <!-- Brand Header -->
      <div style="text-align: center; margin-bottom: 2rem;">
        <div class="brand-logo" style="width: 56px; height: 56px; margin: 0 auto 1rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-green);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <h2 style="font-size: 1.5rem; color: var(--gray-900); margin-bottom: 0.25rem;">
          Staff Roster Portal
        </h2>
        <p style="font-size: 0.875rem; color: var(--gray-600);">
          Sign in with your phone number and PIN to access your duty roster and leave balance
        </p>
      </div>

      <!-- Login Card -->
      <div class="card" style="padding: 2rem 1.5rem; box-shadow: var(--shadow-md);">
        <div id="login-error-box" style="display: none; background: var(--red-50); border: 1px solid var(--red-100); border-radius: var(--radius-md); padding: 0.75rem 1rem; color: var(--red-700); font-size: 0.8125rem; margin-bottom: 1.25rem;"></div>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-phone">Phone Number:</label>
            <div style="position: relative;">
              <input
                type="tel"
                id="login-phone"
                class="form-input"
                placeholder="e.g. 9029794213"
                required
                autocomplete="tel"
                style="padding-left: 2.5rem;"
              />
              <div style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--gray-400);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
            </div>
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <label class="form-label" for="login-pin" style="margin-bottom: 0;">4-Digit PIN:</label>
              <span style="font-size: 0.6875rem; color: var(--green-700); font-weight: 600;">Default: 1234</span>
            </div>
            <div style="position: relative;">
              <input
                type="password"
                id="login-pin"
                class="form-input"
                placeholder="••••"
                maxlength="8"
                value="1234"
                required
                style="padding-left: 2.5rem; letter-spacing: 0.15em;"
              />
              <div style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--gray-400);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" id="btn-submit-login" style="width: 100%; margin-top: 1rem; padding: 0.75rem;">
            <span>Sign In</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </form>

        <!-- Quick One-Tap Demo Profiles -->
        <!--<div style="margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--gray-100);">
          <div style="font-size: 0.75rem; color: var(--gray-500); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; text-align: center;">
            ⚡ Quick Test Profiles
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm quick-login-btn" data-phone="9029794213" style="justify-content: space-between; padding: 0.5rem 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="staff-avatar" style="width: 24px; height: 24px; font-size: 0.625rem;">AS</div>
                <span style="font-weight: 600;">Aisha Sambo</span>
              </div>
              <span class="badge badge-green" style="font-size: 0.6875rem;">Admin</span>
            </button>

            <button class="btn btn-secondary btn-sm quick-login-btn" data-phone="8029794214" style="justify-content: space-between; padding: 0.5rem 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="staff-avatar" style="width: 24px; height: 24px; font-size: 0.625rem; background: var(--gray-600);">JD</div>
                <span style="font-weight: 600;">John Doe</span>
              </div>
              <span class="badge badge-gray" style="font-size: 0.6875rem;">Staff Member</span>
            </button>

            <button class="btn btn-secondary btn-sm quick-login-btn" data-phone="8029724214" style="justify-content: space-between; padding: 0.5rem 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="staff-avatar" style="width: 24px; height: 24px; font-size: 0.625rem; background: var(--gray-600);">MB</div>
                <span style="font-weight: 600;">Maryam Bukar</span>
              </div>
              <span class="badge badge-gray" style="font-size: 0.6875rem;">Staff Member</span>
            </button>
          </div>
        </div>-->
      </div>

      <!-- PWA Install Tip -->
      <div style="text-align: center; margin-top: 1.5rem;">
        <button class="btn btn-outline-green btn-sm" id="btn-login-install">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          <span>Install App to Device</span>
        </button>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  const phoneInput = document.getElementById('login-phone');
  const pinInput = document.getElementById('login-pin');
  const errBox = document.getElementById('login-error-box');

  const executeLogin = async (phone, pin) => {
    errBox.style.display = 'none';
    const submitBtn = document.getElementById('btn-submit-login');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Signing in...';
    }

    try {
      const res = await api.auth.login(phone, pin);
      setAuth(res.user, res.token);
      triggerConfetti();
      showToast(`Welcome back, ${res.user.name}!`);
      window.dispatchEvent(new CustomEvent('app:authenticated'));
    } catch (err) {
      errBox.style.display = 'block';
      errBox.innerText = err.message || 'Login failed. Please check your phone and PIN.';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      }
    }
  };

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    executeLogin(phoneInput.value.trim(), pinInput.value.trim());
  });

  container.querySelectorAll('.quick-login-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const phone = btn.getAttribute('data-phone');
      phoneInput.value = phone;
      pinInput.value = '1234';
      executeLogin(phone, '1234');
    });
  });

  document.getElementById('btn-login-install')?.addEventListener('click', () => {
    openInstallModal();
  });
}
