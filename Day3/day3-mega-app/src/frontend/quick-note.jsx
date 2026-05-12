import React, { useState } from 'react';
import ForgeReconciler, { Text, Heading, Box, Stack, Inline, Spinner, SectionMessage, TextArea, DatePicker, Form, Button, ErrorMessage } from '@forge/react';
import { invoke } from '@forge/bridge';
import { useProductContext } from '@forge/react';

const MAX_NOTE_LENGTH = 500;

const NoteForm = ({ onSuccess }) => {
  const [note, setNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const context = useProductContext();

  const noteValue = typeof note === 'string' ? note : '';

  const noteError = noteValue.length > MAX_NOTE_LENGTH
    ? `Note must be ${MAX_NOTE_LENGTH} characters or less`
    : null;

  const handleSubmit = async () => {
    const trimmedNote = noteValue.trim();
    if (!trimmedNote) {
      setError('Note is required');
      return;
    }
    if (noteError) return;

    setSubmitting(true);
    setError(null);

    try {
      await invoke('saveNote', { note: trimmedNote, reminderDate });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack space="space.200">
      <TextArea
        label="Note"
        name="note"
        placeholder="Enter your note..."
        value={note}
        onChange={(value) => setNote(typeof value === 'string' ? value : (value?.target?.value || ''))}
        isRequired
      />
      {noteError && <ErrorMessage>{noteError}</ErrorMessage>}
      <Text>{`${noteValue.length}/${MAX_NOTE_LENGTH}`}</Text>
      <DatePicker
        label="Reminder Date"
        name="reminderDate"
        placeholder="Select a date (optional)"
        value={reminderDate}
        onChange={(value) => setReminderDate(value)}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Button 
        appearance="primary" 
        onClick={handleSubmit} 
        isDisabled={submitting || !noteValue.trim() || !!noteError}
      >
        {submitting ? 'Saving...' : 'Save Note'}
      </Button>
    </Stack>
  );
};

const App = () => {
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <Box padding="space.200">
        <SectionMessage appearance="success">
          <Text>Note saved successfully!</Text>
        </SectionMessage>
        <Box paddingBlock="space.200">
          <Button appearance="subtle" onClick={() => setSaved(false)}>Add another note</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Heading size="small">Add Quick Note</Heading>
        <NoteForm onSuccess={() => setSaved(true)} />
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);