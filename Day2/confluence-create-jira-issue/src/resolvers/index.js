import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Fetch available projects from Jira
resolver.define('getProjects', async () => {
  const response = await api.asUser().requestJira(route`/rest/api/3/project`);
  if (!response.ok) {
    console.error(`Failed to fetch projects: ${response.status}`);
    return [];
  }
  const projects = await response.json();
  return projects.map(p => ({ id: p.id, key: p.key, name: p.name }));
});

// Fetch available issue types from Jira
resolver.define('getIssueTypes', async () => {
  const response = await api.asUser().requestJira(route`/rest/api/3/issuetype`);
  if (!response.ok) {
    console.error(`Failed to fetch issue types: ${response.status}`);
    return [];
  }
  const types = await response.json();
  // Filter out sub-task types and return name + id
  return types
    .filter(t => !t.subtask)
    .map(t => ({ id: t.id, name: t.name }));
});

// Create a Jira issue
resolver.define('createIssue', async ({ payload }) => {
  const { projectKey, summary, issueType } = payload;

  const response = await api.asUser().requestJira(route`/rest/api/3/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        summary: summary,
        issuetype: { name: issueType }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to create issue: ${response.status} - ${errorText}`);
    return { success: false, error: `Failed to create issue (status ${response.status})` };
  }

  const result = await response.json();
  return {
    success: true,
    key: result.key,
    id: result.id
  };
});

export const handler = resolver.getDefinitions();