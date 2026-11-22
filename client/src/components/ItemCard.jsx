import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ClaimModal from './ClaimModal';

function formatDate(val) {
  if (!val) return 'N/A';
  const d = new Date(`${val}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? val
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ItemCard({ item, onStatusChange, onDelete, onItemUpdated }) {
  const { user, openLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [showClaimsDrawer, setShowClaimsDrawer] = useState(false);

  // Auto-Match state
  const [showMatches, setShowMatches] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matches, setMatches] = useState(null);

  const isOwner = user && (item.isOwner || (item.ownerUsername && item.ownerUsername === user.username));
  const isAdmin = user && user.role === 'admin';
  const canManage = isOwner || isAdmin;

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const nextStatus = item.status === 'returned' ? 'active' : 'returned';
      await onStatusChange(item.id || item._id, nextStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      setLoading(true);
      try {
        await onDelete(item.id || item._id);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReviewClaim = async (claimId, decision) => {
    const note = window.prompt(`Optional note for ${decision}ing this claim:`, '');
    if (note === null) return; // user cancelled

    setLoading(true);
    try {
      await api.reviewClaim(item.id || item._id, claimId, {
        decision,
        reviewNote: note
      });
      if (onItemUpdated) {
        onItemUpdated();
      }
    } catch (err) {
      alert(err.message || 'Error updating claim.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMatches = async () => {
    if (showMatches) {
      setShowMatches(false);
      return;
    }
    setShowMatches(true);
    if (matches === null) {
      setMatchesLoading(true);
      try {
        const res = await api.getMatches(item.id || item._id);
        setMatches(Array.isArray(res.matches) ? res.matches : []);
      } catch (err) {
        console.error('Failed to load matches:', err);
        setMatches([]);
      } finally {
        setMatchesLoading(false);
      }
    }
  };

  // Status Badge Logic
  let badgeClass = 'badge-found';
  let badgeText = item.type.toUpperCase();

  if (item.status === 'returned') {
    badgeClass = 'badge-returned';
    badgeText = 'RETURNED';
  } else if (item.status === 'claim_pending') {
    badgeClass = 'badge-claim_pending';
    badgeText = 'CLAIM PENDING';
  } else if (item.type === 'lost') {
    badgeClass = 'badge-lost';
    badgeText = 'LOST';
  }

  const hasClaims = Array.isArray(item.claims) && item.claims.length > 0;
  const pendingClaims = hasClaims ? item.claims.filter((c) => c.status === 'pending') : [];

  return (
    <>
      <article className="item-card">
        <div className="item-top">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`badge ${badgeClass}`}>{badgeText}</span>
            {item.type === 'found' && item.custodyLocation && (
              <span className="custody-badge" title="Physical location where item is kept">
                <span className="custody-badge-icon">📍</span> {item.custodyLocation}
              </span>
            )}
          </div>
          <span className="item-category">{item.category}</span>
        </div>

        <div className="item-title-row">
          <h3>{item.title}</h3>
          {isOwner && <span className="owner-pill">Your report</span>}
        </div>

        <p className="item-description">{item.description}</p>

        <div className="item-meta">
          <span>
            <strong>Location:</strong> {item.location}
          </span>
          <span>
            <strong>Date:</strong> {formatDate(item.date)}
          </span>
          <span>
            <strong>Contact:</strong> {item.contact}
          </span>
          <span>
            <strong>Reported by:</strong> {item.ownerName || item.ownerUsername || 'Campus User'}
          </span>
        </div>

        {/* Claim Status Pill for Regular Claimant */}
        {item.myClaim && (
          <div style={{ margin: '8px 0', padding: '6px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
            <strong>Your Claim Status: </strong>
            <span className={`claim-status-tag claim-status-${item.myClaim.status}`}>
              {item.myClaim.status === 'pending' && '⏳ Under Review'}
              {item.myClaim.status === 'approved' && '✅ Approved (Item Returned)'}
              {item.myClaim.status === 'rejected' && '❌ Rejected'}
            </span>
            {item.myClaim.reviewNote && (
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '4px' }}>
                Note from reviewer: "{item.myClaim.reviewNote}"
              </div>
            )}
          </div>
        )}

        <div className="item-actions-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {/* File a Claim Button (For Found items, non-owner) */}
          {item.type === 'found' && item.status !== 'returned' && !isOwner && !item.myClaim && (
            <button
              type="button"
              className="btn-claim-action"
              onClick={() => {
                if (!user) {
                  openLogin();
                } else {
                  setClaimModalOpen(true);
                }
              }}
            >
              ✋ Claim This Item
            </button>
          )}

          {/* Owner/Admin Status Buttons */}
          {canManage && (
            <>
              <button
                type="button"
                className="item-action-btn"
                onClick={handleToggleStatus}
                disabled={loading}
              >
                {loading
                  ? 'Updating...'
                  : item.status === 'returned'
                  ? 'Reopen report'
                  : 'Mark as returned'}
              </button>

              {hasClaims && (
                <button
                  type="button"
                  className="btn-toggle-drawer"
                  onClick={() => setShowClaimsDrawer(!showClaimsDrawer)}
                >
                  📋 Review Claims ({pendingClaims.length} pending / {item.claims.length} total)
                </button>
              )}

              <button
                type="button"
                className="item-delete-btn"
                onClick={handleDelete}
                disabled={loading}
                title="Delete report"
              >
                🗑 Delete
              </button>
            </>
          )}

          {/* Smart Auto-Match Button */}
          <button
            type="button"
            className="btn-toggle-drawer"
            onClick={handleLoadMatches}
            style={{ marginLeft: 'auto' }}
          >
            {showMatches ? 'Hide Matches' : '🔍 Smart Matches'}
          </button>
        </div>

        {/* Claims Review Drawer (for Owner or Admin) */}
        {canManage && showClaimsDrawer && hasClaims && (
          <div className="claims-drawer">
            <div className="drawer-header">
              <span>Filed Ownership Claims</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Verify proof before approving</span>
            </div>

            {item.claims.map((claim) => (
              <div key={claim._id || claim.id} className="claim-item-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{claim.claimantName} (@{claim.claimantUsername})</strong>
                  <span className={`claim-status-tag claim-status-${claim.status}`}>
                    {claim.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Contact: {claim.contact} | Submitted: {new Date(claim.submittedAt).toLocaleDateString()}
                </div>
                <div className="claim-proof-box">
                  <strong>Proof of Ownership:</strong> {claim.proofDetails}
                </div>
                {claim.reviewNote && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                    Reviewer Note: {claim.reviewNote}
                  </div>
                )}
                {claim.status === 'pending' && (
                  <div className="claim-actions">
                    <button
                      type="button"
                      className="btn-approve-claim"
                      onClick={() => handleReviewClaim(claim._id || claim.id, 'approve')}
                      disabled={loading}
                    >
                      ✓ Approve Claim & Return
                    </button>
                    <button
                      type="button"
                      className="btn-reject-claim"
                      onClick={() => handleReviewClaim(claim._id || claim.id, 'reject')}
                      disabled={loading}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Smart Matches Drawer */}
        {showMatches && (
          <div className="matches-drawer">
            <div className="drawer-header">
              <span>Potential {item.type === 'lost' ? 'Found' : 'Lost'} Matches</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Scored by category, keywords & location</span>
            </div>

            {matchesLoading && (
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '6px 0' }}>
                Scanning campus database for matching {item.type === 'lost' ? 'found' : 'lost'} items...
              </div>
            )}

            {!matchesLoading && matches && matches.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '6px 0' }}>
                No strong matches found yet. We will keep scanning as new items are reported.
              </div>
            )}

            {!matchesLoading && matches && matches.length > 0 && (
              matches.map((m) => (
                <div key={m.item.id} className="match-card-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{m.item.title}</strong>
                    <span className="match-score-badge">{m.score}% MATCH</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                    {m.item.location} • {m.item.category} • Contact: {m.item.contact}
                  </div>
                  {m.item.custodyLocation && (
                    <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '2px' }}>
                      📍 Currently kept at: <strong>{m.item.custodyLocation}</strong>
                    </div>
                  )}
                  <div className="match-reasons-list">
                    {m.reasons.map((r, idx) => (
                      <span key={idx} className="match-reason-tag">
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </article>

      {/* Claim Modal */}
      <ClaimModal
        item={item}
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        onClaimSubmitted={() => {
          if (onItemUpdated) {
            onItemUpdated();
          }
        }}
      />
    </>
  );
}
