import React from 'react';
import { X, Smartphone, Share2, PlusSquare, CheckCircle, ArrowRight, Laptop } from 'lucide-react';

export default function InstallModal({ isOpen, onClose, onInstallClick, isIOS, canInstallDirectly }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ width: '36px', height: '36px' }}>
              <Smartphone size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem' }}>Install Staff Roster App</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                No App Store or Google Play Store needed
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            background: 'var(--green-50)',
            border: '1px solid var(--green-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <CheckCircle size={24} style={{ color: 'var(--green-600)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.8125rem', color: 'var(--green-800)' }}>
              <strong>Instant & Lightweight:</strong> Install directly from your browser. Works offline, launches in full screen, and receives real-time updates.
            </div>
          </div>

          {isIOS ? (
            <div>
              <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--gray-800)' }}>
                How to install on iPhone & iPad (Safari):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                  <div className="staff-avatar" style={{ background: 'var(--gray-700)' }}>1</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-800)' }}>
                    Tap the <strong>Share</strong> icon <Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> in Safari's bottom toolbar.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                  <div className="staff-avatar" style={{ background: 'var(--gray-700)' }}>2</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-800)' }}>
                    Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                  <div className="staff-avatar" style={{ background: 'var(--gray-700)' }}>3</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-800)' }}>
                    Tap <strong>"Add"</strong> in the top-right corner. The app icon will appear on your Home screen!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--gray-800)' }}>
                1-Click Installation (Android & Chrome / Edge / PC):
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                Tap the button below to add Staff Roster to your home screen or desktop application list.
              </p>

              {canInstallDirectly ? (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                  onClick={onInstallClick}
                >
                  <Smartphone size={18} />
                  <span>Install App to Device</span>
                </button>
              ) : (
                <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', fontSize: '0.8125rem', color: 'var(--gray-700)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                    <Laptop size={16} /> Browser Menu Installation:
                  </div>
                  Click the <strong>Install</strong> icon in the address bar, or open your browser menu (⋮) and select <strong>"Install Staff Roster"</strong> or <strong>"Add to Home screen"</strong>.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
}
