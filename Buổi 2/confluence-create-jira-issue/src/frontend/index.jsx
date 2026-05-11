import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Text, Heading, Box, Stack, Textfield, Select, Button, SectionMessage, Spinner, Lozenge } from '@forge/react';
import { invoke } from '@forge/bridge';
import { useProductContext } from '@forge/react';

const App = () => {
  const [selectedText, setSelectedText] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [issueType, setIssueType] = useState('');
  const [issueTypes, setIssueTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Get selected text from the product context
  const context = useProductContext();

  // Extract selectedText from context and fetch issue types on mount
  useEffect(() => {
    if (context) {
      setSelectedText(context.extension?.selectedText || '');
    }
  }, [context]);

  useEffect(() => {
    (async () => {
      try {
        const types = await invoke('getIssueTypes');
        setIssueTypes(types);
        if (types.length > 0) {
          setIssueType(types[0].name);
        }
      } catch (e) {
        console.error('Failed to fetch issue types:', e);
        setError('Could not load issue types.');
      }

      setLoading(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!projectKey.trim() || !issueType) {
      setError('Please fill in Project Key and Issue Type.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await invoke('createIssue', {
        projectKey: projectKey.trim().toUpperCase(),
        summary: selectedText || 'New issue from Confluence',
        issueType: issueType
      });

      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || 'Failed to create issue.');
      }
    } catch (e) {
      setError('An error occurred while creating the issue.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading..." />;

  // Show success result with link to created issue
  if (result) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="success">
          <Stack space="space.100">
            <Text>Issue created successfully!</Text>
            <Lozenge appearance="success">{result.key}</Lozenge>
          </Stack>
        </SectionMessage>
      </Box>
    );
  }

  const issueTypeOptions = issueTypes.map(t => ({ label: t.name, value: t.name }));

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Heading size="medium">Create Jira Issue</Heading>
        {selectedText && (
          <SectionMessage appearance="info">
            <Text>Selected text will be used as the issue summary.</Text>
          </SectionMessage>
        )}
        {error && (
          <SectionMessage appearance="error">
            <Text>{error}</Text>
          </SectionMessage>
        )}
        <Textfield label="Project Key" value={projectKey} onChange={setProjectKey} placeholder="e.g. PROJ" />
        <Textfield label="Summary" value={selectedText} onChange={setSelectedText} />
        <Select label="Issue Type" options={issueTypeOptions} onChange={setIssueType} value={issueType} />
        <Button text="Create Issue" onClick={handleSubmit} appearance="primary" isDisabled={submitting} />
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);