import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UserAccessBanner from './components/UserAccessBanner';
import StatsGrid from './components/StatsGrid';
import Filters from './components/Filters';
import ItemsGrid from './components/ItemsGrid';
import ReportForm from './components/ReportForm';
import AuthModal from './components/AuthModal';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    status: 'active'
  });

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getItems();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err.message || 'Unable to connect to the backend server or MongoDB.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems, user]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const data = await api.updateItemStatus(id, newStatus);
      setItems((prev) =>
        prev.map((item) => ((item.id || item._id) === id ? { ...item, status: newStatus } : item))
      );
      return data;
    } catch (err) {
      alert(err.message || 'Could not update status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteItem(id);
      setItems((prev) => prev.filter((item) => (item.id || item._id) !== id));
    } catch (err) {
      alert(err.message || 'Could not delete report.');
    }
  };

  const handleReportSubmitted = async (formData) => {
    const data = await api.createItem(formData);
    await loadItems();
    // Scroll to browse section to see newly created item
    const browseEl = document.getElementById('browse');
    if (browseEl) {
      browseEl.scrollIntoView({ behavior: 'smooth' });
    }
    return data;
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredItems = useMemo(() => {
    const query = filters.search.toLowerCase().trim();
    return items.filter((item) => {
      const textToSearch = `${item.title} ${item.description} ${item.location} ${item.category} ${item.ownerName || ''}`.toLowerCase();
      const matchesSearch = !query || textToSearch.includes(query);
      const matchesType = filters.type === 'all' || item.type === filters.type;
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [items, filters]);

  return (
    <div className="app-shell" id="top">
      <Navbar
        onNavigateReport={() => scrollToSection('report')}
        onNavigateBrowse={() => scrollToSection('browse')}
      />

      <main>
        <Hero
          onBrowseClick={() => scrollToSection('browse')}
          onReportClick={() => scrollToSection('report')}
        />

        <UserAccessBanner />

        <StatsGrid items={items} />

        <section id="browse" className="section container" style={{ padding: '24px 0 48px' }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORE REPORTS</span>
              <h2>Browse Campus Reports</h2>
            </div>
            <span className="result-summary">
              {filteredItems.length} {filteredItems.length === 1 ? 'report' : 'reports'} shown
            </span>
          </div>

          <Filters filters={filters} setFilters={setFilters} />

          <ItemsGrid
            items={filteredItems}
            loading={loading}
            error={error}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onReportClick={() => scrollToSection('report')}
            onItemUpdated={loadItems}
          />
        </section>

        <ReportForm onReportSubmitted={handleReportSubmitted} />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <strong>Campus Lost &amp; Found</strong>
          <span>Full-Stack MERN: React · Node.js · Express · MongoDB</span>
        </div>
      </footer>

      <AuthModal />
    </div>
  );
}
