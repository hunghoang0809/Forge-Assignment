import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Fetch available issue types from Jira for the dropdown
resolver.define('getIssueTypes', async () => {
  const response = await api.asApp().requestJira(route`/rest/api/3/issuetype`);
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

// Create a Jira issue with the given project key, summary, and issue type
resolver.define('createIssue', async ({ payload }) => {
  const { projectKey, summary, issueType } = payload;

  const response = await api.asApp().requestJira(route`/rest/api/3/issue`, {
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
    self: result.self
  };
});

export const handler = resolver.getDefinitions();