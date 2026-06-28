import { useState, useRef, useEffect } from 'react';
import { useCalendar } from '../../contexts/CalendarContext';
import { useAuth } from '../../contexts/AuthContext';
import { getMonthName } from '../../utils/dateUtils';
import type { ViewMode } from '../../types';

export default function Header() {
  const { currentDate, viewMode, setViewMode, goToNext, goToPrev, goToToday } = useCalendar();
  const { user, logout } = useAuth();
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (viewRef.current && !viewRef.current.contains(e.target as Node)) {
        setShowViewDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getHeaderTitle = () => {
    const month = getMonthName(currentDate.getMonth());
    const year = currentDate.getFullYear();
    
    if (viewMode === 'month') {
      return `${month} ${year}`;
    }
    if (viewMode === 'day') {
      return `${month} ${currentDate.getDate()}, ${year}`;
    }
    // Week view - show month/year of the week
    return `${month} ${year}`;
  };

  const viewLabels: Record<ViewMode, string> = {
    day: 'Day',
    week: 'Week',
    month: 'Month',
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <div className="header-logo-icon">📅</div>
          <span>TransVolt Calendar</span>
        </div>
      </div>

      <nav className="header-nav">
        <button className="today-btn" onClick={goToToday}>
          Today
        </button>
        <button className="nav-arrow" onClick={goToPrev} aria-label="Previous">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <button className="nav-arrow" onClick={goToNext} aria-label="Next">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
        <h2 className="header-title">{getHeaderTitle()}</h2>
      </nav>

      <div className="header-right">
        <div className="view-switcher" ref={viewRef}>
          <button
            className="view-switcher-btn"
            onClick={() => setShowViewDropdown(!showViewDropdown)}
          >
            {viewLabels[viewMode]}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          {showViewDropdown && (
            <div className="view-dropdown">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`view-dropdown-item ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => {
                    setViewMode(mode);
                    setShowViewDropdown(false);
                  }}
                >
                  {viewLabels[mode]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="user-menu" ref={userRef}>
          <button
            className="user-avatar"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            aria-label="User menu"
          >
            {userInitial}
          </button>
          {showUserDropdown && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-dropdown-name">{user?.name}</div>
                <div className="user-dropdown-email">{user?.email}</div>
              </div>
              <button className="user-dropdown-item" onClick={logout}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
