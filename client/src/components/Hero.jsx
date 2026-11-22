import React from 'react';

export default function Hero({ onBrowseClick, onReportClick }) {
  return (
    <section className="hero">
      <div className="container hero-content">
        <div>
          <span className="eyebrow">ONE CAMPUS · ONE COMMUNITY</span>
          <h1>
            Lost something?<br />
            <span>Let’s find it.</span>
          </h1>
          <p className="hero-text">
            A simple, secure place for campus students and staff to report lost or found
            belongings, search active reports, and help items return to their owners.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={onBrowseClick}
            >
              Browse Items
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={onReportClick}
            >
              Report an Item
            </button>
          </div>
        </div>

        <div className="hero-card" aria-label="How it works">
          <div className="step">
            <span>01</span>
            <div>
              <strong>Report</strong>
              <small>Add item details with category and location.</small>
            </div>
          </div>
          <div className="step">
            <span>02</span>
            <div>
              <strong>Search &amp; Filter</strong>
              <small>Instantly filter by keywords, status, and category.</small>
            </div>
          </div>
          <div className="step">
            <span>03</span>
            <div>
              <strong>Reconnect</strong>
              <small>Reach out to the reporter and mark resolved.</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
