import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CalendarProvider, useCalendar } from './contexts/CalendarContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MonthView from './components/Calendar/MonthView';
import WeekView from './components/Calendar/WeekView';
import DayView from './components/Calendar/DayView';
import EventModal from './components/Event/EventModal';
import EventPopover from './components/Event/EventPopover';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function CalendarApp() {
  const { viewMode, isLoading } = useCalendar();
  const [sidebarCollapsed] = useState(false);

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="loading-overlay">
          <div className="spinner spinner-lg" />
        </div>
      );
    }

    switch (viewMode) {
      case 'month':
        return <MonthView />;
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      default:
        return <MonthView />;
    }
  };

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="calendar-main">{renderView()}</main>
      </div>
      <EventModal />
      <EventPopover />
    </div>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="loading-overlay" style={{ height: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authPage === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthPage('register')} />;
    }
    return <RegisterPage onSwitchToLogin={() => setAuthPage('login')} />;
  }

  return (
    <CalendarProvider>
      <CalendarApp />
    </CalendarProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
