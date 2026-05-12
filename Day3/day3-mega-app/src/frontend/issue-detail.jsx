import React, { useEffect, useState, useCallback } from 'react';
import ForgeReconciler, { Text, Heading, Box, Stack, Inline, Strong, Spinner, SectionMessage, Lozenge, Badge, Button } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIssue = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('[Frontend] Fetching issue details...');
    try {
      const data = await invoke('getIssueDetail');
      console.log('[Frontend] Issue detail data received:', data);
      if (!data) {
        setError('No data returned from server');
        setIssue(null);
      } else {
        setIssue(data);
      }
    } catch (err) {
      console.error('[Frontend] getIssueDetail failed:', err);
      setError(err.message || 'Failed to fetch issue details');
      setIssue(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  if (loading) {
    return <Spinner label="Loading issue details..." />;
  }

  if (error) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
        <Box paddingBlock="space.200">
          <Button appearance="primary" onClick={fetchIssue}>Retry</Button>
        </Box>
      </Box>
    );
  }

  if (!issue) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="warning">
          <Text>No issue data available</Text>
        </SectionMessage>
      </Box>
    );
  }

  const statusAppearanceMap = {
    'done': 'success',
    'indeterminate': 'moved',
    'new': 'default',
  };
  const statusAppearance = statusAppearanceMap[issue.status.category] || 'default';

  const priorityAppearanceMap = {
    'Highest': 'removed',
    'High': 'important',
    'Medium': 'added',
    'Low': 'default',
    'Lowest': 'subtle',
  };
  const priorityAppearance = priorityAppearanceMap[issue.priority] || 'default';

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Inline space="space.100" grow="fill" alignBlock="center" justify="space-between">
          <Heading size="small">{issue.key}</Heading>
          <Button appearance="subtle" onClick={fetchIssue}>Refresh</Button>
        </Inline>
        <Text>{issue.summary}</Text>
        <Inline space="space.200">
          <Inline space="space.050" alignBlock="center">
            <Strong>Status:</Strong>
            <Lozenge appearance={statusAppearance}>{issue.status.name}</Lozenge>
          </Inline>
          <Inline space="space.050" alignBlock="center">
            <Strong>Priority:</Strong>
            <Badge appearance={priorityAppearance}>{issue.priority}</Badge>
          </Inline>
        </Inline>
        <Inline space="space.100">
          <Strong>Assignee:</Strong>
          <Text>{issue.assignee}</Text>
        </Inline>
        <Inline space="space.100">
          <Strong>Comments:</Strong>
          <Text>{issue.commentCount}</Text>
        </Inline>
        <Inline space="space.100">
          <Strong>Created:</Strong>
          <Text>{issue.created}</Text>
        </Inline>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);