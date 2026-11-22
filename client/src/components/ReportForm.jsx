import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

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

const CUSTODY_LOCATIONS = [
  'With Finder',
  'Campus Security Desk',
  'Central Library Front Desk',
  'Student Affairs Office',
  'Department Reception',
  'Lost & Found Center'
];

export default function ReportForm({ onReportSubmitted }) {
  const { user, openLogin } = useAuth();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [formData, setFormData] = useState({
    type: 'lost',
    category: '',
    title: '',
    date: todayStr,
    location: '',
    custodyLocation: 'With Finder',
    description: '',
    contact: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors = [];
    if (!['lost', 'found'].includes(formData.type)) errors.push('Choose whether the item is lost or found.');
    if (!formData.category) errors.push('Select a category.');
    if (formData.title.trim().length < 3) errors.push('Item name must be at least 3 characters.');
    if (formData.location.trim().length < 2) errors.push('Location is required.');
    if (formData.description.trim().length < 10) errors.push('Description must be at least 10 characters.');
    if (!formData.date) errors.push('Date is required.');
    if (formData.contact.trim().length < 5) errors.push('Contact info must be at least 5 characters.');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!user) {
      openLogin();
      return;
    }

    const errors = validate();
    if (errors.length > 0) {
      setMessage({ text: errors.join(' '), type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await onReportSubmitted(formData);
      setMessage({ text: 'Report submitted successfully! Saved to MongoDB.', type: 'success' });
      setFormData({
        type: 'lost',
        category: '',
        title: '',
        date: todayStr,
        location: '',
        custodyLocation: 'With Finder',
        description: '',
        contact: ''
      });
    } catch (err) {
      setMessage({ text: err.message || 'Could not save report.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="report" className="report-section">
      <div className="container report-layout">
        <div className="report-copy">
          <span className="eyebrow">COMMUNITY NOTICE</span>
          <h2>Help someone get their item back.</h2>
          <p>
            Provide accurate details so students and staff can identify the item.
            Reports are permanently linked to your campus account and stored securely in MongoDB.
          </p>
          <div className="privacy-note">
            <strong>Privacy Tip:</strong> Do not include sensitive information like passwords, PIN numbers,
            or confidential card details in the public description.
          </div>
        </div>

        <div className="report-form-container">
          {!user ? (
            <div className="report-form" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
              <h3 style={{ marginBottom: '8px' }}>Login Required to Report</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '20px', fontSize: '0.92rem' }}>
                Please log in to your student or administrator account to post a lost or found report.
              </p>
              <button
                type="button"
                className="button button-primary"
                onClick={openLogin}
              >
                Sign In to Post a Report
              </button>
            </div>
          ) : (
            <form className="report-form" onSubmit={handleSubmit} noValidate>
              <div className="form-row two-col">
                <div className="form-group">
                  <label htmlFor="formType">Report Type *</label>
                  <select
                    id="formType"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="lost">I lost an item</option>
                    <option value="found">I found an item</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="formCategory">Category *</label>
                  <select
                    id="formCategory"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label htmlFor="formTitle">Item Name *</label>
                  <input
                    id="formTitle"
                    name="title"
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Silver Dell Laptop / Keys"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="formDate">Date *</label>
                  <input
                    id="formDate"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="formLocation">Location Where Lost/Found *</label>
                <input
                  id="formLocation"
                  name="location"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Library, 2nd floor, study area"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              {formData.type === 'found' && (
                <div className="form-group">
                  <label htmlFor="formCustody">Current Custody / Holding Location *</label>
                  <select
                    id="formCustody"
                    name="custodyLocation"
                    value={formData.custodyLocation}
                    onChange={handleChange}
                  >
                    {CUSTODY_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">
                    Where is the item currently kept so the rightful owner knows where to claim or collect it?
                  </span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="formDescription">Description *</label>
                <textarea
                  id="formDescription"
                  name="description"
                  rows={4}
                  maxLength={500}
                  placeholder="Color, brand, markings, case, and any identifiable features..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
                <span className="field-hint">
                  {formData.description.length} / 500 characters
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="formContact">Contact Information *</label>
                <input
                  id="formContact"
                  name="contact"
                  type="text"
                  maxLength={100}
                  placeholder="College email or mobile number"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                />
              </div>

              {message.text && (
                <div className={`form-alert ${message.type}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                className="button button-primary button-full"
                disabled={loading}
              >
                {loading ? 'Submitting to MongoDB...' : 'Submit Report'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
