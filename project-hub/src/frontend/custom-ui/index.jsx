import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Router, Routes, Route, Link } from 'react-router-dom';
import { view, invoke } from '@forge/bridge';

// Styles for Custom UI (standard HTML elements, no @forge/react)
const styles = {
  container: { padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  heading: { fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#172B4D' },
  card: { background: '#fff', border: '1px solid #DFE1E6', borderRadius: '8px', padding: '16px', marginBottom: '12px' },
  label: { fontWeight: 600, color: '#42526E', marginRight: '8px' },
  value: { color: '#172B4D' },
  row: { display: 'flex', marginBottom: '8px', alignItems: 'center' },
  nav: { display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #DFE1E6', paddingBottom: '8px' },
  navLink: { textDecoration: 'none', color: '#0052CC', fontWeight: 500, padding: '4px 8px', borderRadius: '4px' },
  navLinkActive: { background: '#DEEBFF', textDecoration: 'none', color: '#0747A6', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #DFE1E6', fontWeight: 600, color: '#42526E', fontSize: '12px', textTransform: 'uppercase' },
  td: { padding: '8px 12px', borderBottom: '1px solid #DFE1E6', color: '#172B4D' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: 700 },
  badgeSuccess: { background: '#E3FCEF', color: '#006644' },
  badgeRemoved: { background: '#FFEBE6', color: '#BF2600' },
  badgeMoved: { background: '#EAE6FF', color: '#403294' },
  badgeDefault: { background: '#DFE1E6', color: '#42526E' },
  loading: { textAlign: 'center', padding: '40px', color: '#42526E' }
};

// Determine badge style based on status/priority
const badgeStyle = (text) => {
  const lower = text?.toLowerCase() || '';
  if (['done', 'closed', 'highest', 'critical'].includes(lower)) return { ...styles.badge, ...styles.badgeRemoved };
  if (['in progress', 'high', 'medium'].includes(lower)) return { ...styles.badge, ...styles.badgeMoved };
  if (['to do', 'open', 'low', 'lowest'].includes(lower)) return { ...styles.badge, ...styles.badgeSuccess };
  return { ...styles.badge, ...styles.badgeDefault };
};

// Navigation sidebar links
const Nav = ({ currentPath }) => (
  <nav style={styles.nav}>
    <Link to="/" style={currentPath === '/' ? styles.navLinkActive : styles.navLink}>Overview</Link>
    <Link to="/recent-issues" style={currentPath === '/recent-issues' ? styles.navLinkActive : styles.navLink}>Recent Issues</Link>
    <Link to="/team" style={currentPath === '/team' ? styles.navLinkActive : styles.navLink}>Team</Link>
  </nav>
);

// Overview page: project key, type, issue count
const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke('getProjectOverview').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading project overview...</div>;
  if (!data) return <div style={styles.loading}>Failed to load project details.</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Project Overview</h1>
      <div style={styles.card}>
        <div style={styles.row}>
          <span style={styles.label}>Key:</span>
          <span style={styles.value}>{data.key}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Name:</span>
          <span style={styles.value}>{data.name}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Type:</span>
          <span style={badgeStyle(data.type)}>{data.type}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Style:</span>
          <span style={styles.value}>{data.style}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Total Issues:</span>
          <span style={styles.value}>{data.issueCount}</span>
        </div>
      </div>
    </div>
  );
};

// Recent Issues page: 5 newest issues in a table
const RecentIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke('getRecentIssues').then(setIssues).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading recent issues...</div>;
  if (!issues.length) return <div style={styles.container}><p>No recent issues found.</p></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Recent Issues</h1>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Key</th>
              <th style={styles.th}>Summary</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Assignee</th>
              <th style={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <tr key={issue.key}>
                <td style={styles.td}>{issue.key}</td>
                <td style={styles.td}>{issue.summary}</td>
                <td style={styles.td}><span style={badgeStyle(issue.status)}>{issue.status}</span></td>
                <td style={styles.td}>{issue.priority}</td>
                <td style={styles.td}>{issue.assignee}</td>
                <td style={styles.td}>{issue.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Team page: members with assignments in the last 7 days
const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke('getTeamMembers').then(setMembers).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading team members...</div>;
  if (!members.length) return <div style={styles.container}><p>No team members found in the last 7 days.</p></div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Team</h1>
      <p style={{ color: '#42526E', marginBottom: '16px' }}>Members with issue assignments in the last 7 days</p>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, i) => (
              <tr key={i}>
                <td style={styles.td}>{member.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main App: react-router-dom routing driven by view.createHistory()
const App = () => {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    view.createHistory().then(setHistory);
  }, []);

  if (!history) return <div style={styles.loading}>Loading...</div>;

  return (
    <Router location={history.location} navigator={history}>
      <Nav currentPath={history.location.pathname} />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/recent-issues" element={<RecentIssues />} />
        <Route path="/team" element={<Team />} />
      </Routes>
    </Router>
  );
};

// Custom UI: use ReactDOM instead of ForgeReconciler
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);