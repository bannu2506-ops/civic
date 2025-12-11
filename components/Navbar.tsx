import React from 'react';

interface NavbarProps {
  currentView: 'citizen' | 'authority';
  setView: (view: 'citizen' | 'authority') => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, onLogout }) => {
  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">CivicEye AI</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-2 mr-4 border-r border-slate-700 pr-4">
              <button
                onClick={() => setView('citizen')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === 'citizen' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                Report Issue
              </button>
              <button
                onClick={() => setView('authority')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentView === 'authority' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                Authority Dashboard
              </button>
            </div>
            <button
              onClick={onLogout}
              className="text-gray-300 hover:text-white p-2 rounded-md hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;