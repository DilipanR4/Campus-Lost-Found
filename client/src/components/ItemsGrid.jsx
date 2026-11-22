import React from 'react';
import ItemCard from './ItemCard';

export default function ItemsGrid({
  items = [],
  loading = false,
  error = null,
  onStatusChange,
  onDelete,
  onReportClick,
  onItemUpdated
}) {
  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⏳</div>
        <h3>Loading campus reports...</h3>
        <p>Fetching the latest items from MongoDB database.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠</div>
        <h3>Connection Note</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⌕</div>
        <h3>No matching reports</h3>
        <p>Try adjusting your search keywords or filters, or be the first to report an item.</p>
        <button
          type="button"
          className="button button-primary"
          onClick={onReportClick}
        >
          Report an Item
        </button>
      </div>
    );
  }

  return (
    <div className="items-grid" aria-live="polite">
      {items.map((item) => (
        <ItemCard
          key={item.id || item._id}
          item={item}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onItemUpdated={onItemUpdated}
        />
      ))}
    </div>
  );
}
