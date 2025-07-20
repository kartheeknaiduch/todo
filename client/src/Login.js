import React, { useState } from 'react';
import axios from 'axios';
import config from './config';

function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${config.apiUrl}/api/users/login`, { email, password });
      onLogin(res.data.token, res.data.email);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1f1f3a] to-[#2a235d] text-white">
      <form onSubmit={handleSubmit} className="bg-[#23233a] p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        {error && <div className="mb-4 text-red-400">{error}</div>}
        <div className="mb-4">
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-[#2f2f4f] text-white"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-[#2f2f4f] text-white"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded mb-2">Login</button>
        <div className="text-center mt-2">
          <span>Don't have an account? </span>
          <button type="button" className="text-purple-400 underline" onClick={switchToRegister}>Register</button>
        </div>
      </form>
    </div>
  );
}

export default Login; 