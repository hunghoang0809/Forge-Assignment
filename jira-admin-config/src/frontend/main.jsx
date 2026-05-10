import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text, Heading, Box, Stack, Spinner, SectionMessage, Lozenge } from '@forge/react';
import { invoke } from '@forge/bridge';

// Main admin page: displays the saved API key configuration
const App = () => {
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    invoke('getConfig')
      .then(data => {
        setApiKey(data.apiKey);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load config:', err);
        setError('Could not load configuration.');
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner label="Loading configuration..." />;

  if (error) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
      </Box>
    );
  }

  return (
    <Box padding="space.200">
      <Stack space="space.300">
        <Heading size="large">Admin Dashboard</Heading>
        <Stack space="space.100">
          <Text>Saved Configuration</Text>
          {apiKey ? (
            <Stack space="space.100">
              <Lozenge appearance="success">Configured</Lozenge>
              <Text>API Key: {apiKey.substring(0, 4)}{'*'.repeat(Math.max(0, apiKey.length - 4))}</Text>
            </Stack>
          ) : (
            <SectionMessage appearance="warning">
              <Text>No API key configured. Click "Configure" in Manage Apps to set up.</Text>
            </SectionMessage>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);