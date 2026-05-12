import React, { useEffect, useState, useCallback } from 'react';
import ForgeReconciler, {
  Text, Heading, Box, Stack, Inline, Spinner, SectionMessage,
  DynamicTable, Lozenge, Badge, Button
} from '@forge/react';
import { invoke } from '@forge/bridge';

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

const OverviewTab = ({ data }) => {
  const { stats, statusDistribution } = data;

  const chartRows = Object.entries(statusDistribution).map(([name, value], idx) => ({
    key: name,
    cells: [
        { key: 'status', content: name },
        { key: 'count', content: value.toString() }
    ]
  }));

  return (
    <Stack space="space.300">
      <Inline space="space.200">
        <Box padding="space.200">
            <Heading size="small">Total Issues</Heading>
            <Text>{stats.total}</Text>
        </Box>
        <Box padding="space.200">
            <Heading size="small">In Progress</Heading>
            <Text>{stats.inProgress}</Text>
        </Box>
        <Box padding="space.200">
            <Heading size="small">Done</Heading>
            <Text>{stats.done}</Text>
        </Box>
        <Box padding="space.200">
            <Heading size="small">Bugs</Heading>
            <Text>{stats.bugs}</Text>
        </Box>
      </Inline>
      <Heading size="small">Status Distribution</Heading>
      {chartRows.length > 0 ? (
        <DynamicTable
          head={{ cells: [{ key: 'status', content: 'Status' }, { key: 'count', content: 'Count' }] }}
          rows={chartRows}
        />
      ) : (
        <Text>No status data available</Text>
      )}
    </Stack>
  );
};



const StaleTab = ({ data }) => {
  if (data.staleIssues.length === 0) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="success" title="No stale issues!">
          <Text>All issues have been updated within the last 7 days.</Text>
        </SectionMessage>
      </Box>
    );
  }

  const rows = data.staleIssues.map((issue) => ({
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
      { key: 'updated', content: new Date(issue.updated).toLocaleDateString() },
    ],
  }));

  return (
    <Stack space="space.200">
      <Heading size="small">Stale Issues (7+ days without update)</Heading>
      <DynamicTable
        caption="Stale Issues"
        head={{
          cells: [
            { key: 'key', content: 'Key' },
            { key: 'summary', content: 'Summary' },
            { key: 'status', content: 'Status' },
            { key: 'updated', content: 'Last Updated' },
          ],
        }}
        rows={rows}
        rowsPerPage={10}
      />
    </Stack>
  );
};

const BugsChartTab = ({ data }) => {
  const { bugsByPriority } = data;
  const priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];

  const rows = priorities
    .filter(p => bugsByPriority[p])
    .map((p) => ({
      key: p,
      cells: [
          { key: 'priority', content: p },
          { key: 'count', content: bugsByPriority[p].toString() }
      ]
    }));

  if (rows.length === 0) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="info">
          <Text>No bugs found in this project</Text>
        </SectionMessage>
      </Box>
    );
  }

  return (
    <Stack space="space.200">
      <Heading size="small">Bugs by Priority</Heading>
      <DynamicTable
        head={{ cells: [{ key: 'priority', content: 'Priority' }, { key: 'count', content: 'Count' }] }}
        rows={rows}
      />
    </Stack>
  );
};

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('getDashboardData');
      if (!result) {
        setError('No data returned');
        setData(null);
      } else {
        setData(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <Spinner label="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="error">
          <Text>{error}</Text>
        </SectionMessage>
        <Box paddingBlock="space.200">
          <Button appearance="primary" onClick={fetchData}>Retry</Button>
        </Box>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="warning">
          <Text>No data available</Text>
        </SectionMessage>
      </Box>
    );
  }

  return (
    <Box padding="space.200">
      <Stack space="space.400">
        <Inline space="space.100" grow="fill" alignBlock="center" justify="space-between">
          <Heading size="large">Project Health Dashboard</Heading>
          <Button appearance="subtle" onClick={fetchData}>Refresh</Button>
        </Inline>
        
        <OverviewTab data={data} />
        
        <Stack space="space.400">
            <BugsChartTab data={data} />
            <StaleTab data={data} />
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