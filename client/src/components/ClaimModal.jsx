import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function ClaimModal({ item, isOpen, onClose, onClaimSubmitted }) {
  const { user } = useAuth();
  const [proofDetails, setProofDetails] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (proofDetails.trim().length < 5) {
      setError('Please provide at least 5 characters describing distinguishing marks or proof of ownership.');
      return;
    }
    if (contact.trim().length < 5) {
      setError('Please provide your valid contact phone or email.');
      return;
    }

    setLoading(true);
    try {
      await api.submitClaim(item.id || item._id, {
        proofDetails: proofDetails.trim(),
        contact: contact.trim()
      });
      onClaimSubmitted();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not submit claim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>
            Verification Process
          </span>
          <h2 style={{ fontSize: '1.25rem', marginTop: '4px', color: 'var(--ink)' }}>
            Claim Found Item: {item.title}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginTop: '4px' }}>
            Found at <strong>{item.location}</strong> on {item.date}.
          </p>
        </div>

        {error && <div className="form-alert error" style={{ marginBottom: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label>Claimant</label>
            <input
              type="text"
              value={`${user?.name || user?.username} (@${user?.username})`}
              disabled
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label>Your Contact Info *</label>
            <input
              type="text"
              placeholder="e.g. your_id@campus.edu or 9876543210"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Proof of Ownership & Distinguishing Details *</label>
            <textarea
              rows={4}
              placeholder="Describe unique details that prove this belongs to you (e.g. scratch on corner, wallpaper, brand of charger inside, stickers, serial number)..."
              value={proofDetails}
              onChange={(e) => setProofDetails(e.target.value)}
              required
            />
            <span className="field-hint">
              This proof is kept private and only shown to the finder or campus administrator.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="button button-outline"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
              style={{ flex: 2 }}
            >
              {loading ? 'Submitting Claim...' : 'Submit Claim Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
