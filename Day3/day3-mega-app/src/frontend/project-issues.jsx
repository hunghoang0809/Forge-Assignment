import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ForgeReconciler, { Text, Heading, Box, Stack, Inline, Spinner, SectionMessage, DynamicTable, Lozenge, Badge, Button } from '@forge/react';
import { invoke } from '@forge/bridge';

const FILTERS = ['all', 'open', 'bugs'];

const App = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke('getProjectIssues');
      setIssues(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const filteredIssues = useMemo(() => {
    if (filter === 'open') return issues.filter(i => i.status.category !== 'done');
    if (filter === 'bugs') return issues.filter(i => i.type === 'Bug');
    return issues;
  }, [issues, filter]);

  if (loading) {
    return <Spinner label="Loading issues..." />;
  }

  if (error) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
      </Box>
    );
  }

  if (!issues.length) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="info">
          <Text>No issues found in this project</Text>
        </SectionMessage>
      </Box>
    );
  }

  const statusAppearanceMap = {
    'done': 'success',
    'indeterminate': 'moved',
    'new': 'default',
  };

  const priorityAppearanceMap = {
    'Highest': 'removed',
    'High': 'important',
    'Medium': 'added',
    'Low': 'default',
    'Lowest': 'subtle',
  };

  const rows = filteredIssues.map((issue) => ({
    key: issue.key,
    cells: [
      { key: 'key', content: issue.key },
      { key: 'summary', content: issue.summary },
      {
        key: 'status',
        content: (
          <Lozenge appearance={statusAppearanceMap[issue.status.category] || 'default'}>
            {issue.status.name}
          </Lozenge>
        ),
      },
      {
        key: 'priority',
        content: (
          <Badge appearance={priorityAppearanceMap[issue.priority] || 'default'}>
            {issue.priority}
          </Badge>
        ),
      },
      { key: 'assignee', content: issue.assignee },
    ],
  }));

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Inline space="space.100" grow="fill" alignBlock="center" justify="space-between">
          <Heading size="medium">Project Issues</Heading>
          <Button appearance="subtle" onClick={fetchIssues}>Refresh</Button>
        </Inline>
        <Inline space="space.100">
          {FILTERS.map(f => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              appearance={filter === f ? 'primary' : 'subtle'}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </Inline>
        <DynamicTable
          caption="Project Issues"
          head={{
            cells: [
              { key: 'key', content: 'Key', isSortable: true },
              { key: 'summary', content: 'Summary' },
              { key: 'status', content: 'Status' },
              { key: 'priority', content: 'Priority' },
              { key: 'assignee', content: 'Assignee' },
            ],
          }}
          rows={rows}
          rowsPerPage={10}
        />
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);