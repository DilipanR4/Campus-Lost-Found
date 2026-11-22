import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function DbStatusBadge() {
  const [status, setStatus] = useState({ connected: false, loading: true, host: null, name: null });
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await api.getStatus();
      setStatus({
        connected: Boolean(data?.database?.connected),
        loading: false,
        host: data?.database?.host,
        name: data?.database?.name,
        error: data?.database?.error,
        uriSet: data?.database?.uriSet
      });
    } catch {
      setStatus({ connected: false, loading: false, host: null, name: null });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll status every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <button
        type="button"
        className={`db-pill ${status.connected ? 'connected' : 'disconnected'}`}
        onClick={() => setModalOpen(true)}
        title="Click to view MongoDB connection details"
      >
        <span className="status-dot"></span>
        <span>{status.connected ? 'MongoDB Connected' : 'MongoDB: Configure URI'}</span>
      </button>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <div className="eyebrow">DATABASE INTEGRATION</div>
            <h3 style={{ marginBottom: '12px' }}>MongoDB Setup &amp; Status</h3>

            <div
              className={`form-alert ${status.connected ? 'success' : 'error'}`}
              style={{ marginBottom: '16px' }}
            >
              {status.connected ? (
                <div>
                  <strong>✔ Connected to MongoDB!</strong>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Database: <code>{status.name || 'campus_lost_found'}</code> | Host: <code>{status.host}</code>
                  </div>
                </div>
              ) : (
                <div>
                  <strong>⚠ MongoDB is not connected yet.</strong>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                    {status.error || 'Server is waiting for a valid MongoDB connection.'}
                  </div>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '12px' }}>
              You can connect either a <strong>local MongoDB</strong> database or a <strong>MongoDB Atlas (Cloud)</strong> cluster.
            </p>

            <div className="db-guide-box">
              <strong>1. Open your <code>.env</code> file in the project folder:</strong>
              <div className="code-snippet">campus-lost-found/.env</div>

              <strong style={{ marginTop: '10px', display: 'block' }}>2. For MongoDB Atlas (Cloud):</strong>
              <div className="code-snippet">
                MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.xxxxx.mongodb.net/campus_lost_found?retryWrites=true&amp;w=majority
              </div>

              <strong style={{ marginTop: '10px', display: 'block' }}>3. For Local MongoDB:</strong>
              <div className="code-snippet">
                MONGODB_URI=mongodb://127.0.0.1:27017/campus_lost_found
              </div>

              <strong style={{ marginTop: '10px', display: 'block' }}>4. Default Demo Accounts Created:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '0.82rem' }}>
                <li>Student: <code>student1</code> / <code>student123</code></li>
                <li>Admin: <code>admin</code> / <code>admin123</code></li>
              </ul>
            </div>

            <button
              className="button button-primary button-full"
              onClick={() => {
                fetchStatus();
                setModalOpen(false);
              }}
            >
              Refresh &amp; Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
