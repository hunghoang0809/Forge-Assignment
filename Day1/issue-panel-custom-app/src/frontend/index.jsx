import ForgeReconciler, {
  Text,
  Heading,
  Stack,
  Inline,
  Badge,
  Tag,
  Lozenge,
  Spinner,
  SectionMessage,
  useProductContext,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import React, { useState, useEffect } from 'react';

// ── Helper function: format ngày tháng ──────────────────────
const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// ── Helper function: xác định appearance cho StatusLozenge ──
const getStatusAppearance = (statusName) => {
  const name = statusName?.toLowerCase() ?? '';
  if (name.includes('done') || name.includes('closed') || name.includes('resolved'))
    return 'success';
  if (name.includes('progress') || name.includes('review') || name.includes('testing'))
    return 'inprogress';
  if (name.includes('blocked') || name.includes('cancelled'))
    return 'removed';
  return 'default';
};

// ── Helper function: xác định màu Tag cho priority ──────────
const getPriorityColor = (priority) => {
  const p = priority?.toLowerCase() ?? '';
  if (p === 'highest' || p === 'critical') return 'red';
  if (p === 'high') return 'red';
  if (p === 'medium') return 'yellow';
  if (p === 'low') return 'green';
  if (p === 'lowest') return 'teal';
  return 'standard';
};

// ── Main Component ───────────────────────────────────────────
const IssueInfoPanel = () => {
  const context = useProductContext();

  // State management
  const [issueData, setIssueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('--- Frontend: useEffect triggered ---');
    console.log('Context hiện tại:', context);

    if (!context) {
      console.log('Frontend: Đang đợi context...');
      return;
    }

    const issueKey = context.extension?.issue?.key;
    if (!issueKey) {
      console.log('Frontend: Không tìm thấy issueKey trong context');
      return;
    }

    console.log('Frontend: Bắt đầu gọi invoke getIssueDetails cho issue:', issueKey);

    invoke('getIssueDetails', { issueKey })
      .then((data) => {
        console.log('Frontend: Nhận dữ liệu thành công:', data);
        setIssueData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Frontend: Lỗi invoke:', err);
        setError(err.message ?? 'Đã xảy ra lỗi không xác định');
        setIsLoading(false);
      });
  }, [context]);

  // ── Render: Loading State ────────────────────────────────
  if (isLoading) {
    return (
      <Stack space='space.200' alignInline='center'>
        <Spinner size='medium' label='Đang tải thông tin issue...' />
        <Text>Đang tải...</Text>
      </Stack>
    );
  }

  // ── Render: Error State ──────────────────────────────────
  if (error) {
    return (
      <SectionMessage appearance='error' title='Không thể tải thông tin'>
        <Text>{error}</Text>
        <Text>Hãy thử tải lại trang nếu lỗi tiếp tục xảy ra.</Text>
      </SectionMessage>
    );
  }

  // ── Render: Success State ────────────────────────────────
  return (
    <Stack space='space.200'>
      <Heading as='h4'>{issueData.key}</Heading>
      <Text>{issueData.summary}</Text>

      <Inline space='space.100' alignBlock='center'>
        <Text>Trạng thái:</Text>
        <Lozenge
          text={issueData.status}
          appearance={getStatusAppearance(issueData.status)}
        />
      </Inline>

      <Inline space='space.100' alignBlock='center'>
        <Text>Độ ưu tiên:</Text>
        <Tag
          text={issueData.priority}
          color={getPriorityColor(issueData.priority)}
        />
      </Inline>

      <Inline space='space.100' alignBlock='center'>
        <Text>Người phụ trách:</Text>
        <Text>{issueData.assignee}</Text>
      </Inline>

      <Inline space='space.100' alignBlock='center'>
        <Text>Ngày tạo:</Text>
        <Text>{formatDate(issueData.created)}</Text>
      </Inline>
    </Stack>
  );
};

// Render component vào Forge sandbox
ForgeReconciler.render(
  <React.StrictMode>
    <IssueInfoPanel />
  </React.StrictMode>
);