import React, { useState } from 'react';
import { STORE_NAME } from '../constants';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';

interface LoginProps {
  onLogin: (username: string, password; string) => void;
  loginError: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, loginError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };
  
  const inputClasses = "w-full bg-brand-surface dark:bg-[#374151] border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition";

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-bg dark:bg-[#1F2937]">
      <div className="w-full max-w-sm p-6 space-y-4 bg-brand-header dark:bg-[#111827] rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">{STORE_NAME}</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClasses}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {loginError && <p className="text-sm text-red-500 dark:text-red-400 text-center">{loginError}</p>}
          <div>
            <button type="submit" className="w-full px-4 py-3 font-bold text-white bg-brand-primary rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-header dark:focus:ring-offset-[#111827] focus:ring-brand-primary">
              Log In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
