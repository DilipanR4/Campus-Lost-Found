import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    register
  } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModalOpen) return null;

  const handleFillDemo = (type) => {
    setError('');
    if (type === 'student') {
      setUsername('student1');
      setPassword('student123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authModalTab === 'login') {
        await login(username, password);
      } else {
        if (!name.trim()) {
          throw new Error('Please provide your full name.');
        }
        await register(username, password, name, role);
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={() => setAuthModalOpen(false)}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${authModalTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setAuthModalTab('login');
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`modal-tab ${authModalTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setAuthModalTab('register');
              setError('');
            }}
          >
            Register Account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {authModalTab === 'register' && (
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {authModalTab === 'register' && (
            <div className="form-group">
              <label>Account Role *</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          {error && <div className="form-alert error">{error}</div>}

          <button
            type="submit"
            className="button button-primary button-full"
            disabled={loading}
            style={{ marginTop: '6px' }}
          >
            {loading
              ? 'Please wait...'
              : authModalTab === 'login'
              ? 'Log In'
              : 'Create Account'}
          </button>
        </form>

        <div className="demo-account-helpers">
          <p>Quick demo account autofill:</p>
          <div className="demo-btn-group">
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleFillDemo('student')}
            >
              👤 Student (student1)
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleFillDemo('admin')}
            >
              👑 Admin (admin)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
