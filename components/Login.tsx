import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

type AuthMethod = 'options' | 'email' | 'phone';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [method, setMethod] = useState<AuthMethod>('options');
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulatedLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
          alt="Smart City" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-500 p-2 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="font-bold text-3xl text-white tracking-tight">CivicEye AI</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Building Safer Cities <br/>Together
            </h1>
            <p className="text-lg text-slate-300 max-w-md">
              Join thousands of citizens and authorities using AI to detect, report, and resolve infrastructure issues in real-time.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 text-slate-400 text-sm">
              <span>Real-time Detection</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
              <span>Authority Dashboard</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-slate-600">Please enter your details to sign in.</p>
          </div>

          {method === 'options' && (
            <div className="space-y-4 mt-8">
              <button 
                onClick={() => handleSimulatedLogin()}
                className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-lg shadow-sm bg-white hover:bg-slate-50 transition-colors duration-200"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5 mr-3" alt="Google" />
                <span className="text-slate-700 font-medium">Continue with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              <button 
                onClick={() => setMethod('email')}
                className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 font-medium"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Sign in with Email
              </button>

              <button 
                onClick={() => setMethod('phone')}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-slate-100 text-slate-700 rounded-lg hover:border-slate-300 transition-colors duration-200 font-medium"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Sign in with Phone
              </button>
            </div>
          )}

          {method === 'email' && (
            <form onSubmit={handleSimulatedLogin} className="space-y-6 mt-8">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
                <input type="email" id="email" required className="mt-1 block w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="name@example.com" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                <input type="password" id="password" required className="mt-1 block w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Forgot password?</a>
                </div>
              </div>
              <div className="space-y-3">
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait">
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
                <button type="button" onClick={() => setMethod('options')} className="w-full text-center text-sm text-slate-500 hover:text-slate-800">
                  ← Back to options
                </button>
              </div>
            </form>
          )}

          {method === 'phone' && (
            <form onSubmit={handleSimulatedLogin} className="space-y-6 mt-8">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number</label>
                <input type="tel" id="phone" required className="mt-1 block w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="text-sm text-slate-500">
                We'll send you a One-Time Password (OTP) to this number.
              </div>
              <div className="space-y-3">
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait">
                  {isLoading ? 'Send OTP' : 'Continue'}
                </button>
                <button type="button" onClick={() => setMethod('options')} className="w-full text-center text-sm text-slate-500 hover:text-slate-800">
                  ← Back to options
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-xs text-slate-400 mt-8">
            By signing in, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;