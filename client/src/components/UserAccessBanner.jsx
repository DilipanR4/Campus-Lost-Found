import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function UserAccessBanner() {
  const { user, openLogin, openRegister } = useAuth();

  return (
    <section className="access-section">
      <div className="container access-card">
        {user ? (
          <>
            <div>
              <span className="eyebrow">ROLE-BASED ACCESS CONTROL</span>
              <h2>Hello, {user.name}</h2>
              <p>
                {user.role === 'admin'
                  ? `Logged in as @${user.username} (Admin). You have elevated privileges to update or delete any campus report.`
                  : `Logged in as @${user.username} (Student). You can submit reports and mark or reopen your own items.`}
              </p>
            </div>
            {user.role === 'admin' && (
              <div className="permission-box">
                <strong>👑 Admin Access Active</strong>
                <span>Full status override and delete permissions enabled.</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <span className="eyebrow">CAMPUS PORTAL</span>
              <h2>Welcome to Campus Lost &amp; Found</h2>
              <p>You can freely browse all reports below. Log in to submit or update your reports.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="button button-primary"
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                onClick={openLogin}
              >
                Sign In
              </button>
              <button
                type="button"
                className="button button-secondary"
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                onClick={openRegister}
              >
                Register
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
