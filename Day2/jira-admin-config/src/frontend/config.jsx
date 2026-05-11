import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text, Heading, Box, Stack, Textfield, Button, Spinner, SectionMessage, Lozenge } from '@forge/react';
import { invoke } from '@forge/bridge';

// Configure page (useAsConfig): saves API key to Forge Storage
const App = () => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Load existing config on mount
  useEffect(() => {
    invoke('getConfig')
      .then(data => {
        setApiKey(data.apiKey || '');
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load config:', err);
        setError('Could not load existing configuration.');
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await invoke('saveConfig', { apiKey });
      setSaved(true);
    } catch (e) {
      console.error('Failed to save config:', e);
      setError('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading configuration..." />;

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Heading size="medium">Configure API Key</Heading>
        {error && (
          <SectionMessage appearance="error">
            <Text>{error}</Text>
          </SectionMessage>
        )}
        {saved && (
          <SectionMessage appearance="success">
            <Text>API key saved successfully!</Text>
          </SectionMessage>
        )}
        <Textfield label="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key" />
        <Button onClick={handleSave} appearance="primary" isDisabled={saving}>Save</Button>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);