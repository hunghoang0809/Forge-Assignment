import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text,
  useProductContext,
  Heading,
  Box,
  Stack,
  Spinner,
  SectionMessage,
  Strong,
  Inline,
  Lozenge,
  Code,
  Em,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const context = useProductContext();
  const [spaceData, setSpaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFromBackend = async () => {
      try {
        const data = await invoke('getSpaceDetails', context);
        setSpaceData(data);
      } catch (err) {
        console.error('Invoke error:', err);
        setError('Failed to fetch data from the backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchFromBackend();
  }, []);

  // Show a loading spinner during initialization
  if (!context || (loading && !spaceData)) {
    return (
      <Box padding="space.600">
        <Stack alignBlock="center" space="space.200">
          <Spinner size="large" />
          <Text>Fetching Space Data via Resolver...</Text>
        </Stack>
      </Box>
    );
  }

  // Handle potential errors
  if (error) {
    return (
      <Box padding="space.600">
        <SectionMessage appearance="error" title="Error">
          <Text>{error}</Text>
        </SectionMessage>
      </Box>
    );
  }

  const spaceKey = context.extension.space.key;
  const spaceName = spaceData?.name || 'Unknown';

  return (
    <Box padding="space.600">
      <Stack space="space.400">
        <Box
          padding="space.500"
          borderRadius="borderRadius.large"
          borderStyle="solid"
          borderWidth="border.width"
          borderColor="color.border.accent.blue"
        >
          <Stack space="space.300">
            <Heading as="h2">Resolved Space Identity</Heading>

            <Stack space="space.100">
              <Inline space="space.100" alignBlock="center">
                <Text color="color.text.subtle">Space Name:</Text>
                <Lozenge appearance="success" isBold>{spaceName}</Lozenge>
              </Inline>

              <Inline space="space.100" alignBlock="center">
                <Text color="color.text.subtle">Space Key:</Text>
                <Lozenge appearance="new">{spaceKey}</Lozenge>
              </Inline>
              <Inline space="space.100" alignBlock="center">
                <Text color="color.text.subtle">Space ID:</Text>
                <Lozenge appearance="new">{spaceData?.id}</Lozenge>
              </Inline>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
