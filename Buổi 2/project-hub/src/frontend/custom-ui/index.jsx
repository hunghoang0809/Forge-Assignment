import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Router, Routes, Route, Link } from 'react-router-dom';
import { view, invoke } from '@forge/bridge';
import './styles.css';

// Determine badge class based on status/priority
const getBadgeClass = (text) => {
  const lower = text?.toLowerCase() || '';
  if (['done', 'closed', 'highest', 'critical'].includes(lower)) return 'badge badgeRemoved';
  if (['in progress', 'high', 'medium'].includes(lower)) return 'badge badgeMoved';
  if (['to do', 'open', 'low', 'lowest'].includes(lower)) return 'badge badgeSuccess';
  return 'badge badgeDefault';
};

// Navigation sidebar links
// Navigation sidebar links
const Nav = ({ currentPath = '/' }) => {
  const isOverview = currentPath === '/' || currentPath === '/overview';
  return (
    <nav className="nav">
      <Link to="/overview" className={isOverview ? 'navLinkActive' : 'navLink'}>Overview</Link>
      <Link to="/recent-issues" className={currentPath === '/recent-issues' ? 'navLinkActive' : 'navLink'}>Recent Issues</Link>
      <Link to="/team" className={currentPath === '/team' ? 'navLinkActive' : 'navLink'}>Team</Link>
    </nav>
  );
};

// Overview page: project key, type, issue count
const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke('getProjectOverview').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading project overview...</div>;
  if (!data) return <div className="loading">Failed to load project details.</div>;

  return (
    <div className="container">
      <h1 className="heading">Project Overview</h1>
      <div className="card">
        <div className="row">
          <span className="label">Key:</span>
          <span className="value">{data.key}</span>
        </div>
        <div className="row">
          <span className="label">Name:</span>
          <span className="value">{data.name}</span>
        </div>
        <div className="row">
          <span className="label">Type:</span>
          <span className={getBadgeClass(data.type)}>{data.type}</span>
        </div>
        <div className="row">
          <span className="label">Style:</span>
          <span className="value">{data.style}</span>
        </div>
        <div className="row">
          <span className="label">Total Issues:</span>
          <span className="value">{data.issueCount}</span>
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

  if (loading) return <div className="loading">Loading recent issues...</div>;
  if (!issues.length) return <div className="container"><p>No recent issues found.</p></div>;

  return (
    <div className="container">
      <h1 className="heading">Recent Issues</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Key</th>
              <th className="th">Summary</th>
              <th className="th">Status</th>
              <th className="th">Priority</th>
              <th className="th">Assignee</th>
              <th className="th">Created</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <tr key={issue.key}>
                <td className="td">{issue.key}</td>
                <td className="td">{issue.summary}</td>
                <td className="td"><span className={getBadgeClass(issue.status)}>{issue.status}</span></td>
                <td className="td">{issue.priority}</td>
                <td className="td">{issue.assignee}</td>
                <td className="td">{issue.created}</td>
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

  if (loading) return <div className="loading">Loading team members...</div>;
  if (!members.length) return <div className="container"><p>No team members found in the last 7 days.</p></div>;

  return (
    <div className="container">
      <h1 className="heading">Team</h1>
      <p style={{ color: '#42526E', marginBottom: '16px' }}>Members with issue assignments in the last 7 days</p>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Name</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, i) => (
              <tr key={i}>
                <td className="td">{member.name}</td>
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
  const [historyState, setHistoryState] = useState(null);

  useEffect(() => {
    view.createHistory().then((history) => {
      const updateState = (location, action) => {
        setHistoryState({
          action: action || history.action,
          location: location || history.location,
          navigator: history
        });
      };

      // Initialize state
      updateState(history.location, history.action);

      // Listen for changes (handling both history v4 and v5 signatures)
      history.listen((arg1, arg2) => {
        if (arg2) {
          // v4: (location, action)
          updateState(arg1, arg2);
        } else if (arg1 && arg1.location) {
          // v5: ({ location, action })
          updateState(arg1.location, arg1.action);
        } else {
          // Fallback
          updateState(arg1, null);
        }
      });
    });
  }, []);

  if (!historyState || !historyState.location) return <div className="loading">Loading...</div>;

  return (
    <Router location={historyState.location} navigator={historyState.navigator}>
      <Nav currentPath={historyState.location.pathname || '/'} />
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