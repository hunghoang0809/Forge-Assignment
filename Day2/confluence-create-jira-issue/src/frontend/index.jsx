import React, { useEffect, useState } from 'react';
import ForgeReconciler, { 
  Text, 
  Heading, 
  Box, 
  Stack, 
  Textfield, 
  Select, 
  Button, 
  SectionMessage, 
  Spinner, 
  Link
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { useProductContext } from '@forge/react';

const App = () => {
  const context = useProductContext();
  const [selectedText, setSelectedText] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [projects, setProjects] = useState([]);
  const [issueType, setIssueType] = useState('');
  const [issueTypes, setIssueTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Lấy text được bôi đen từ context
  useEffect(() => {
    if (context) {
      setSelectedText(context.extension?.selectedText || '');
    }
  }, [context]);

  // Load danh sách Project và Issue Type khi mở modal
  useEffect(() => {
    (async () => {
      try {
        const [projData, typeData] = await Promise.all([
          invoke('getProjects'),
          invoke('getIssueTypes')
        ]);
        
        setProjects(projData);
        if (projData.length > 0) {
          setProjectKey(projData[0].key);
        }

        setIssueTypes(typeData);
        if (typeData.length > 0) {
          setIssueType(typeData[0].name);
        }
      } catch (e) {
        console.error('Failed to fetch data:', e);
        setError('Could not load Jira configuration.');
      }
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!projectKey || !issueType || !selectedText.trim()) {
      setError('Vui lòng chọn đầy đủ Project, Issue Type và nhập Summary.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await invoke('createIssue', {
        projectKey: projectKey,
        summary: selectedText.trim(),
        issueType: issueType
      });

      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || 'Không thể tạo issue.');
      }
    } catch (e) {
      setError('Đã có lỗi xảy ra khi tạo issue.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Đang tải..." />;

  // Màn hình thông báo thành công
  if (result) {
    const issueUrl = `${context?.siteUrl}/browse/${result.key}`;
    return (
      <Box padding="space.200">
        <Stack space="space.200" alignBlock="center">
          <SectionMessage appearance="success">
            <Text>Issue <strong>{result.key}</strong> đã được tạo thành công!</Text>
          </SectionMessage>
          <Link href={issueUrl} openNewTab>
            Xem Issue trên Jira
          </Link>
          <Button onClick={() => setResult(null)}>Tạo thêm issue khác</Button>
        </Stack>
      </Box>
    );
  }

  const projectOptions = projects.map(p => ({ label: `${p.name} (${p.key})`, value: p.key }));
  const issueTypeOptions = issueTypes.map(t => ({ label: t.name, value: t.name }));

  return (
    <Box padding="space.200">
      <Stack space="space.300">
        <Heading size="medium">Tạo Jira Issue từ văn bản chọn</Heading>
        
        {error && (
          <SectionMessage appearance="error">
            <Text>{error}</Text>
          </SectionMessage>
        )}

        <Stack space="space.200">
          <Select 
            label="Chọn Dự án (Project)" 
            options={projectOptions} 
            onChange={(val) => setProjectKey(val)} 
            value={projectKey} 
          />
          
          <Select 
            label="Loại Issue (Issue Type)" 
            options={issueTypeOptions} 
            onChange={(val) => setIssueType(val)} 
            value={issueType} 
          />

          <Textfield 
            label="Tóm tắt (Summary)" 
            value={selectedText} 
            onChange={setSelectedText} 
            placeholder="Nhập tóm tắt issue..."
          />
        </Stack>

        {/* Cố định lỗi Button: Dùng children thay vì prop text */}
        <Button 
          onClick={handleSubmit} 
          appearance="primary" 
          isDisabled={submitting}
        >
          {submitting ? "Đang tạo..." : "Tạo Issue"}
        </Button>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);