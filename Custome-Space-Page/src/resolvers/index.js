import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

// Define a function to fetch space details from the backend
resolver.define('getSpaceDetails', async ({ context }) => {
  const startTime = Date.now();
  const functionName = 'getSpaceDetails';
  const spaceKey = context?.extension?.space?.key;
  const accountId = context?.accountId;

  console.log(`[LOG] Function called: ${functionName} | spaceKey: ${spaceKey} | accountId: ${accountId}`);

  if (!spaceKey) {
    console.error(`[LOG] Error: No spaceKey found in context for ${functionName}`);
    throw new Error('Space key not found in context.');
  }


  const endpoint = `/wiki/api/v2/spaces?keys=${spaceKey}`;
  console.log(`[LOG] API request sent to URL: ${endpoint}`);

  const response = await api.asApp().requestConfluence(
    route`/wiki/api/v2/spaces?keys=${spaceKey}`
  );

  // Check for successful response
  if (!response.ok) {
    const status = response.status;
    const text = await response.text();
    console.error(`[LOG] API Error (Status ${status}): ${text}`);
    throw new Error('Failed to fetch space details from backend.');
  }

  const data = await response.json();
  const spaceResult = data.results && data.results.length > 0 ? data.results[0] : null;

  const durationMs = Date.now() - startTime;
  const resultSummary = spaceResult ? `Space Name: ${spaceResult.name}` : 'No space found';
  console.log(`[LOG] Function completed successfully | Duration: ${durationMs}ms | Result: ${resultSummary}`);

  return spaceResult;
});

export const handler = resolver.getDefinitions();
