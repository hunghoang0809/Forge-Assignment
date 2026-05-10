import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Fetch project details + total issue count for the Overview page
resolver.define('getProjectOverview', async ({ extension }) => {
  const projectKey = extension.project.key;

  const projectResponse = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}`);
  if (!projectResponse.ok) {
    console.error(`Failed to fetch project ${projectKey}: ${projectResponse.status}`);
    return null;
  }
  const project = await projectResponse.json();

  // Get total issue count via JQL search
  const searchResponse = await api.asApp().requestJira(route`/rest/api/3/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jql: `project = ${projectKey}`,
      maxResults: 0,
      fields: []
    })
  });
  const searchResult = searchResponse.ok ? await searchResponse.json() : { total: 0 };

  return {
    key: projectKey,
    name: project.name,
    type: project.projectTypeKey,
    style: project.style,
    issueCount: searchResult.total || 0
  };
});

// Fetch 5 most recently created issues for the Recent Issues page
resolver.define('getRecentIssues', async ({ extension }) => {
  const projectKey = extension.project.key;

  const response = await api.asApp().requestJira(route`/rest/api/3/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jql: `project = ${projectKey} ORDER BY created DESC`,
      maxResults: 5,
      fields: ['summary', 'status', 'priority', 'assignee', 'created']
    })
  });

  if (!response.ok) {
    console.error(`Failed to fetch recent issues: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return data.issues.map(issue => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name || 'Unknown',
    priority: issue.fields.priority?.name || 'None',
    assignee: issue.fields.assignee?.displayName || 'Unassigned',
    created: new Date(issue.fields.created).toLocaleDateString()
  }));
});

// Fetch team members assigned to issues in the last 7 days
resolver.define('getTeamMembers', async ({ extension }) => {
  const projectKey = extension.project.key;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const response = await api.asApp().requestJira(route`/rest/api/3/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jql: `project = ${projectKey} AND assignee IS NOT EMPTY AND updated >= "${sevenDaysAgo}"`,
      maxResults: 100,
      fields: ['assignee']
    })
  });

  if (!response.ok) {
    console.error(`Failed to fetch team members: ${response.status}`);
    return [];
  }

  const data = await response.json();
  const assignees = new Map();
  for (const issue of data.issues) {
    const assignee = issue.fields.assignee;
    if (assignee && !assignees.has(assignee.accountId)) {
      assignees.set(assignee.accountId, {
        name: assignee.displayName,
        avatarUrl: assignee.avatarUrls?.['48x48'] || ''
      });
    }
  }

  return Array.from(assignees.values());
});

export const handler = resolver.getDefinitions();