import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Fetch project details + total issue count for the Overview page
resolver.define('getProjectOverview', async ({ context }) => {
  const projectId = context.extension.project.id;
  const projectKey = context.extension.project.key;

  // 1. Get Project Details
  const projectResponse = await api.asApp().requestJira(route`/rest/api/3/project/${projectId}`);
  if (!projectResponse.ok) {
    console.error(`Failed to fetch project ${projectId}: ${projectResponse.status}`);
    return null;
  }
  const project = await projectResponse.json();

  // 2. Count issues by fetching records directly (as requested)
  // We fetch up to 1000 issues and count the array length
  const searchResponse = await api.asApp().requestJira(
    route`/rest/api/3/search/jql?jql=project="${projectKey}"&maxResults=1000&fields=id`
  );
  
  let count = 0;
  if (searchResponse.ok) {
    const data = await searchResponse.json();
    count = (data.issues || []).length;
    console.log(`Manual count for ${projectKey}: found ${count} records in response.`);
  } else {
    console.error(`Manual count failed with status ${searchResponse.status}`);
  }

  return {
    key: projectKey,
    name: project.name,
    type: project.projectTypeKey,
    style: project.style,
    issueCount: count
  };
});

// Fetch 5 most recently created issues for the Recent Issues page
resolver.define('getRecentIssues', async ({ context }) => {
  const projectKey = context.extension.project.key;
  const jql = `project = "${projectKey}" ORDER BY created DESC`;

  const response = await api.asApp().requestJira(
    route`/rest/api/3/search/jql?jql=${jql}&maxResults=5&fields=summary,status,priority,assignee,created`
  );

  if (!response.ok) {
    console.error(`Recent issues search failed (${response.status})`);
    return [];
  }

  const data = await response.json();
  return (data.issues || []).map(issue => ({
    key: issue.key || 'N/A',
    summary: issue.fields?.summary || 'No Summary',
    status: issue.fields?.status?.name || 'Unknown',
    priority: issue.fields?.priority?.name || 'None',
    assignee: issue.fields?.assignee?.displayName || 'Unassigned',
    created: issue.fields?.created ? new Date(issue.fields.created).toLocaleDateString() : 'N/A'
  }));
});

// Fetch team members assigned to issues
resolver.define('getTeamMembers', async ({ context }) => {
  const projectKey = context.extension.project.key;
  const jql = `project = "${projectKey}" AND assignee IS NOT EMPTY`;

  const response = await api.asApp().requestJira(
    route`/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=assignee`
  );

  if (!response.ok) {
    console.error(`Team members search failed (${response.status})`);
    return [];
  }

  const data = await response.json();
  const assignees = new Map();
  for (const issue of (data.issues || [])) {
    const assignee = issue.fields?.assignee;
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