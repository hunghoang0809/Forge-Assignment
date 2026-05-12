import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// --- Bài 3.5: getDashboardData ---
resolver.define('getDashboardData', async ({ context }) => {
  console.log('[Backend] Executing getDashboardData');
  const projectKey = context.extension?.project?.key;
  if (!projectKey) {
    console.error('[Backend] Project key not found in context');
    throw new Error('Project key not found in context');
  }

  console.log(`[Backend] Searching issues for dashboard in project ${projectKey}`);
  const response = await api.asApp().requestJira(route`/rest/api/3/search/jql`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jql: `project = "${projectKey}"`,
      maxResults: 100,
      fields: ['summary', 'status', 'priority', 'assignee', 'issuetype', 'updated', 'created']
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Backend] Jira API Search Error (${response.status}):`, errorText);
    throw new Error(`Failed to fetch dashboard data: ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`[Backend] Successfully fetched ${data.issues?.length} issues for dashboard`);
  
  const issues = data.issues.map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary || '',
    status: {
      name: issue.fields.status?.name || 'Unknown',
      category: issue.fields.status?.statusCategory?.key || 'new',
    },
    priority: issue.fields.priority?.name || 'Unprioritized',
    assignee: issue.fields.assignee?.displayName ?? 'Unassigned',
    type: issue.fields.issuetype?.name || 'Task',
    updated: issue.fields.updated,
    created: issue.fields.created,
  }));

  const statusDistribution = issues.reduce((acc, issue) => {
    acc[issue.status.name] = (acc[issue.status.name] || 0) + 1;
    return acc;
  }, {});

  const bugsByPriority = issues.filter(i => i.type === 'Bug').reduce((acc, issue) => {
    acc[issue.priority] = (acc[issue.priority] || 0) + 1;
    return acc;
  }, {});

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  return {
    stats: {
      total: issues.length,
      inProgress: issues.filter(i => i.status.category === 'indeterminate').length,
      done: issues.filter(i => i.status.category === 'done').length,
      bugs: issues.filter(i => i.type === 'Bug').length
    },
    statusDistribution,
    bugsByPriority,
    issues,
    staleIssues: issues.filter(i => i.updated && i.updated < sevenDaysAgo),
  };
});

export const handler = resolver.getDefinitions();