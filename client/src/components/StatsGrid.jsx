import React from 'react';

export default function StatsGrid({ items = [] }) {
  const total = items.length;
  const lost = items.filter((i) => i.type === 'lost' && i.status === 'active').length;
  const found = items.filter((i) => i.type === 'found' && i.status === 'active').length;
  const returned = items.filter((i) => i.status === 'returned').length;

  return (
    <section className="stats-section" aria-label="Lost and found statistics">
      <div className="container stats-grid">
        <article className="stat-card">
          <span>{total}</span>
          <p>Total Reports</p>
        </article>

        <article className="stat-card lost">
          <span>{lost}</span>
          <p>Active Lost Items</p>
        </article>

        <article className="stat-card found">
          <span>{found}</span>
          <p>Active Found Items</p>
        </article>

        <article className="stat-card returned">
          <span>{returned}</span>
          <p>Returned to Owners</p>
        </article>
      </div>
    </section>
  );
}
