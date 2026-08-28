import React from 'react';
import { Calendar, Users, FileText, BarChart3, Download, RefreshCw, Smartphone } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenInstall,
  onRefresh,
  isInstalled,
  canInstall
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-group" onClick={() => setActiveTab('roster')}>
          <div className="brand-logo">
            <Calendar size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1>Staff Roster</h1>
              <span className="brand-badge">PWA</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 500 }}>
              Automated Scheduling
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="desktop-nav">
          <button
            className={`nav-tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveTab('roster')}
          >
            <Calendar size={16} />
            <span>Roster</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            <Users size={16} />
            <span>Staff Directory</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaves')}
          >
            <FileText size={16} />
            <span>Leave Requests</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={16} />
            <span>Fairness Stats</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="nav-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            title="Refresh data"
          >
            <RefreshCw size={15} />
            <span style={{ display: 'none', md: 'inline' }}>Refresh</span>
          </button>

          {!isInstalled && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onOpenInstall}
              title="Install App without App Store"
            >
              <Smartphone size={16} />
              <span>Install App</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
