import Resolver from '@forge/resolver';
import api, { route, storage } from '@forge/api';

const resolver = new Resolver();

// --- Bài 3.1: getContext ---
resolver.define('getContext', async (req) => {
  console.log('[Backend] Executing getContext');
  return req.context;
});

// --- Bài 3.2: getIssueDetail ---
resolver.define('getIssueDetail', async ({ context }) => {
  console.log('[Backend] Executing getIssueDetail');
  const issueKey = context.extension?.issue?.key;
  if (!issueKey) throw new Error('Issue key not found');

  console.log(`[Backend] Fetching details for ${issueKey}`);
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?fields=summary,status,priority,assignee,comment,created`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Backend] Jira API Error (${response.status}):`, errorText);
    throw new Error(`Failed to fetch issue ${issueKey}: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    key: issueKey,
    summary: data.fields.summary || '',
    status: {
      name: data.fields.status?.name || 'Unknown',
      category: data.fields.status?.statusCategory?.key || 'new',
    },
    priority: data.fields.priority?.name || 'Unprioritized',
    assignee: data.fields.assignee?.displayName ?? 'Unassigned',
    commentCount: data.fields.comment?.total ?? 0,
    created: new Date(data.fields.created).toLocaleDateString(),
  };
});

// --- Bài 3.3: saveNote ---
resolver.define('saveNote', async ({ context, payload }) => {
  console.log('[Backend] Executing saveNote', payload);
  const { note, reminderDate } = payload;
  const accountId = context.accountId;
  const issueKey = context.extension?.issue?.key;
  
  if (!issueKey) throw new Error('Issue key not found');
  
  const key = `note:${accountId}:${issueKey}`;
  await storage.set(key, { note, reminderDate, savedAt: new Date().toISOString() });
  
  console.log(`[Backend] Note saved for ${issueKey} under key ${key}`);
  return { success: true, key };
});

// --- Bài 3.4: getProjectIssues ---
resolver.define('getProjectIssues', async ({ context }) => {
  console.log('[Backend] Executing getProjectIssues');
  const projectKey = context.extension?.project?.key;
  if (!projectKey) throw new Error('Project key not found');

  console.log(`[Backend] Fetching issues for project ${projectKey}`);
  const response = await api.asApp().requestJira(route`/rest/api/3/search/jql`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jql: `project = "${projectKey}"`,
      maxResults: 50,
      fields: ['summary', 'status', 'priority', 'assignee', 'issuetype']
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Backend] Jira API Search Error (${response.status}):`, errorText);
    throw new Error(`Failed to fetch issues: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[Backend] Successfully fetched ${data.issues?.length} issues`);
  return data.issues.map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary || '',
    status: {
      name: issue.fields.status?.name || 'Unknown',
      category: issue.fields.status?.statusCategory?.key || 'new',
    },
    priority: issue.fields.priority?.name || 'Unprioritized',
    assignee: issue.fields.assignee?.displayName ?? 'Unassigned',
    type: issue.fields.issuetype?.name || 'Task',
  }));
});

export const handler = resolver.getDefinitions();