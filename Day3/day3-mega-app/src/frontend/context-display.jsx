import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Heading, Box, Stack, Spinner, SectionMessage, DynamicTable } from '@forge/react';
import { useProductContext } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  // Bước 1: Đọc context
  const context = useProductContext();

  // Bước 2: Khai báo state variables
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bước 3: Fetch data khi context sẵn sàng
  useEffect(() => {
    if (!context) return;

    console.log('[Frontend] Context found, invoking getContext');
    invoke('getContext')
      .then(data => {
        console.log('[Frontend] Debug info received:', data);
        setDebugData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Frontend] getContext failed:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [context]);

  // Bước 4: Render theo từng state
  if (!context) return null;

  if (loading) {
    return <Spinner size="medium" label="Đang tải thông tin..." />;
  }

  if (error) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="error" title="Không thể tải dữ liệu">
          <Text>{error}</Text>
        </SectionMessage>
      </Box>
    );
  }

  const rows = [
    { key: 'accountId', cells: [{ content: 'accountId' }, { content: debugData.accountId || 'N/A' }] },
    { key: 'cloudId', cells: [{ content: 'cloudId' }, { content: debugData.cloudId || 'N/A' }] },
    { key: 'locale', cells: [{ content: 'locale' }, { content: debugData.locale || 'N/A' }] },
    { key: 'timezone', cells: [{ content: 'timezone' }, { content: debugData.timezone || 'N/A' }] },
    { key: 'issueKey', cells: [{ content: 'issue.key' }, { content: debugData.extension?.issue?.key || 'N/A' }] },
    { key: 'projectKey', cells: [{ content: 'project.key' }, { content: debugData.extension?.project?.key || 'N/A' }] },
  ];

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <DynamicTable
          caption="Product Context"
          head={{
            cells: [
              { key: 'field', content: 'Field' },
              { key: 'value', content: 'Value' },
            ],
          }}
          rows={rows}
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