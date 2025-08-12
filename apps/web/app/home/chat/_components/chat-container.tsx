'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { MessageCircle } from 'lucide-react';

interface ChatContainerProps {
  userId: string;
}

// Mock data for now to avoid API issues
const mockConversations = [
  {
    id: '1',
    chatId: 'chat1',
    contactName: 'John Doe',
    contactNumber: '+1234567890',
    isGroup: false,
    lastMessageAt: new Date().toISOString(),
    unreadCount: 2,
  },
  {
    id: '2',
    chatId: 'chat2',
    contactName: 'Jane Smith',
    contactNumber: '+0987654321',
    isGroup: false,
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
  },
];

const mockMessages = [
  {
    id: '1',
    messageId: 'msg1',
    fromNumber: '+1234567890',
    toNumber: '+1111111111',
    messageType: 'text' as const,
    content: 'Hello! How are you?',
    isFromMe: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    messageId: 'msg2',
    fromNumber: '+1111111111',
    toNumber: '+1234567890',
    messageType: 'text' as const,
    content: 'Hi! I am doing great, thanks for asking!',
    isFromMe: true,
    timestamp: new Date().toISOString(),
  },
];

export function ChatContainer({ userId }: ChatContainerProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>();

  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
    // TODO: Implement actual message sending
  };

  const selectedConversationData = mockConversations.find(c => c.id === selectedConversation);

  return (
    <div className="flex flex-col h-full space-y-4">
      <Card>
        <CardHeader className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>WhatsApp Chat</CardTitle>
          <CardDescription>
            Connect your WhatsApp to start managing conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <a href="/home/settings/whatsapp">Connect WhatsApp</a>
          </Button>
        </CardContent>
      </Card>

      {/* Chat Interface Placeholder */}
      <div className="flex flex-1 gap-4 min-h-0">
        <div className="w-1/3 min-w-[300px]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No conversations available. Connect WhatsApp first.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Select a conversation to start chatting
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
