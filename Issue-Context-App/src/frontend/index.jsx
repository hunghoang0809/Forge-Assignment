import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text, Heading, Box, Inline, Stack, Strong, Spinner } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke('getIssueDetails')
      .then((data) => {
        setIssue(data);
      })
      .catch((err) => {
        console.error('Error invoking getIssueDetails:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Spinner label="Loading details..." />;
  }

  if (!issue) {
    return <Text>Failed to load issue details.</Text>;
  }

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Heading size="medium">Risk Context Details</Heading>
        <Stack space="space.100">
          <Inline space="space.100">
            <Strong>Priority:</Strong>
            <Text>{issue.priority}</Text>
          </Inline>
          <Inline space="space.100">
            <Strong>Issue type:</Strong>
            <Text>{issue.issueType}</Text>
          </Inline>
          <Inline space="space.100">
            <Strong>Assignee:</Strong>
            <Text>{issue.assignee}</Text>
          </Inline>
          <Inline space="space.100">
            <Strong>Created Date:</Strong>
            <Text>{issue.created}</Text>
          </Inline>
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
