import Resolver from '@forge/resolver';
import { storage } from '@forge/api';

const resolver = new Resolver();

// Retrieve saved API key from Forge Storage
resolver.define('getConfig', async () => {
  const apiKey = await storage.get('apiKey');
  return { apiKey: apiKey || '' };
});

// Save API key to Forge Storage
resolver.define('saveConfig', async ({ payload }) => {
  const { apiKey } = payload;
  await storage.set('apiKey', apiKey);
  return { success: true, apiKey };
});

export const handler = resolver.getDefinitions();