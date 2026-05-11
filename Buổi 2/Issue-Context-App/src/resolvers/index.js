import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Resolver for the issue context panel UI — fetches priority, issue type, assignee, created date
resolver.define('getIssueDetails', async ({ context }) => {
  const issueKey = context.extension.issue.key;
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?fields=priority,issuetype,assignee,created`);

  if (!response.ok) {
    console.error(`Failed to fetch issue details for ${issueKey}: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const priorityName = data.fields.priority?.name || 'Unprioritized';

  let riskLabel = 'Low Risk';
  let appearance = 'success';

  if (priorityName === 'Highest' || priorityName === 'Critical') {
    riskLabel = 'High Risk';
    appearance = 'removed';
  } else if (priorityName === 'High') {
    riskLabel = 'Medium Risk';
    appearance = 'moved';
  }

  return {
    priority: priorityName,
    issueType: data.fields.issuetype?.name || 'Unknown',
    assignee: data.fields.assignee?.displayName || 'Unassigned',
    created: new Date(data.fields.created).toLocaleDateString(),
    riskLabel,
    appearance
  };
});

export const handler = resolver.getDefinitions();

// Dynamic properties handler for the issue context lozenge badge
// Updates the badge label and appearance based on the issue priority
export const riskScoreDynamicPropertiesHandler = async (payload) => {
  // Extract issueKey safely from various possible payload structures
  const issueKey = payload.extension?.issue?.key || payload.context?.extension?.issue?.key;

  if (!issueKey) {
    console.error("Could not find issueKey in payload:", JSON.stringify(payload));
    return { 
      status: { 
        type: 'lozenge', 
        value: { label: 'Error', type: 'removed' } 
      } 
    };
  }

  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?fields=priority`);

  if (!response.ok) {
    // Show error state as a red lozenge when the API call fails
    return {
      status: {
        type: 'lozenge',
        value: {
          label: 'Error',
          type: 'removed'
        }
      }
    };
  }

  const data = await response.json();
  const priorityName = data.fields.priority?.name;
  console.log("Priority name: ", priorityName);

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
    status: {
      type: 'lozenge',
      value: {
        label: riskLabel,
        type: appearance
      }
    }
  };
};
