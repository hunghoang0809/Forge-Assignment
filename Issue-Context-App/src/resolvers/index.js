import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Resolver for the issue context panel UI — fetches priority, issue type, assignee, created date
resolver.define('getIssueDetails', async ({ extension }) => {
  const issueKey = extension.issue.key;
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?fields=priority,issuetype,assignee,created`);

  if (!response.ok) {
    console.error(`Failed to fetch issue details for ${issueKey}: ${response.status}`);
    return null;
  }

  const data = await response.json();
  return {
    priority: data.fields.priority?.name || 'Unprioritized',
    issueType: data.fields.issuetype?.name || 'Unknown',
    assignee: data.fields.assignee?.displayName || 'Unassigned',
    created: new Date(data.fields.created).toLocaleDateString()
  };
});

export const handler = resolver.getDefinitions();

// Dynamic properties handler for the issue context lozenge badge
// Updates the badge label and appearance based on the issue priority
export const riskScoreDynamicPropertiesHandler = async (payload) => {
  const issueKey = payload.extension.issue.key;
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?fields=priority`);

  if (!response.ok) {
    // Show error state as a red lozenge when the API call fails
    return {
      label: 'Error',
      status: {
        type: 'lozenge',
        appearance: 'removed'
      }
    };
  }

  const data = await response.json();
  const priorityName = data.fields.priority?.name;

  // Highest/Critical → red (removed), High → purple (moved), Medium/Low/Lowest → green (success)
  let riskLabel = 'Low Risk';
  let appearance = 'success';

  if (priorityName === 'Highest' || priorityName === 'Critical') {
    riskLabel = 'High Risk';
    appearance = 'removed';
  } else if (priorityName === 'High') {
    riskLabel = 'Medium Risk';
    appearance = 'moved';
  }
  // Medium, Low, Lowest all fall through to the default: Low Risk / success (green)

  return {
    label: riskLabel,
    status: {
      type: 'lozenge',
      appearance: appearance
    }
  };
};
