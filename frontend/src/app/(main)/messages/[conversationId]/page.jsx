'use client';

import { useParams } from 'next/navigation';
import { ChatView } from '../../../../components/ChatView';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = Array.isArray(params?.conversationId)
    ? params.conversationId[0]
    : params?.conversationId;

  return <ChatView conversationId={conversationId} />;
}
