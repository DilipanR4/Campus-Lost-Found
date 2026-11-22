import React from 'react';
import { useAuth } from '../context/AuthContext';
import DbStatusBadge from './DbStatusBadge';

export default function Navbar({ onNavigateReport, onNavigateBrowse }) {
  const { user, logout, openLogin, openRegister } = useAuth();

  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Main navigation">
        <a className="brand" href="#top">
          <span className="brand-mark">LF</span>
          <span>Campus Lost &amp; Found</span>
        </a>

        <div className="nav-links">
          <DbStatusBadge />

          <a
            href="#browse"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigateBrowse?.();
            }}
          >
            Browse
          </a>

          {user ? (
            <>
              <a
                href="#report"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateReport?.();
                }}
              >
                Report Item
              </a>

              <div className="user-badge">
                <span>{user.name}</span>
                <span className={`role-tag ${user.role}`}>{user.role}</span>
              </div>

              <button
                type="button"
                className="button button-outline"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="button button-secondary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                onClick={openLogin}
              >
                Login
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                onClick={openRegister}
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
