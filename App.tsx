import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ReportForm from './components/ReportForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { CivicReport } from './types';

const App: React.FC = () => {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // App State
  const [currentView, setCurrentView] = useState<'citizen' | 'authority'>('citizen');
  // Default to 0 reports as requested
  const [reports, setReports] = useState<CivicReport[]>([]);

  const handleNewReport = (report: CivicReport) => {
    setReports(prev => [report, ...prev]);
    // Automatically switch to dashboard to see the result
    setTimeout(() => setCurrentView('authority'), 500);
  };

  const handleUpdateReport = (id: string, updates: Partial<CivicReport>) => {
    setReports(prev => prev.map(report => 
      report.id === id ? { ...report, ...updates } : report
    ));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setReports([]); // Optional: clear session data on logout
    setCurrentView('citizen');
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        currentView={currentView} 
        setView={setCurrentView} 
        onLogout={handleLogout}
      />
      
      <main className="flex-grow">
        {currentView === 'citizen' ? (
          <ReportForm onReportSubmit={handleNewReport} />
        ) : (
          <Dashboard 
            reports={reports} 
            onUpdateReport={handleUpdateReport}
          />
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} CivicEye AI. Powered by Gemini.</p>
          <p className="mt-2 text-xs">This is a demonstration. Data is processed locally in browser or mock environments.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;