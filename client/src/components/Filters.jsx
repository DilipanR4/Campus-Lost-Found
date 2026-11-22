import React from 'react';

const CATEGORIES = [
  'Electronics',
  'ID Card',
  'Books',
  'Keys',
  'Bag',
  'Clothing',
  'Accessories',
  'Other'
];

export default function Filters({ filters, setFilters }) {
  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="filters-bar" aria-label="Item filters">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          placeholder="Search by title, description, or location..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          autoComplete="off"
        />
      </div>

      <select
        className="filter-select"
        value={filters.type}
        onChange={(e) => handleChange('type', e.target.value)}
        aria-label="Filter by report type"
      >
        <option value="all">All Types (Lost &amp; Found)</option>
        <option value="lost">Lost Only</option>
        <option value="found">Found Only</option>
      </select>

      <select
        className="filter-select"
        value={filters.category}
        onChange={(e) => handleChange('category', e.target.value)}
        aria-label="Filter by category"
      >
        <option value="all">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
        aria-label="Filter by status"
      >
        <option value="active">Active Only</option>
        <option value="claim_pending">Claims Under Review</option>
        <option value="returned">Returned Only</option>
        <option value="all">All Statuses</option>
      </select>
    </div>
  );
}
