'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { MessageCircle, Phone, Users } from 'lucide-react';

import { WhatsAppSession, WhatsAppConversation } from '~/lib/whatsapp/types';
import { ConversationList } from './conversation-list';
import { ChatWindow } from './chat-window';

interface ChatContainerProps {
  userId: string;
}

export function ChatContainer({ userId }: ChatContainerProps) {
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null);

  // Fetch sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['whatsapp-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/whatsapp/session/status');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    },
  });

  // Fetch conversations for selected session
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['whatsapp-conversations', selectedSession?.id],
    queryFn: async () => {
      if (!selectedSession?.id) return { conversations: [] };
      
      const response = await fetch(`/api/whatsapp/conversations?sessionId=${selectedSession.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return response.json();
    },
    enabled: !!selectedSession?.id,
  });

  const sessions: WhatsAppSession[] = sessionsData?.sessions || [];
  const conversations: WhatsAppConversation[] = conversationsData?.conversations || [];
  const connectedSessions = sessions.filter(session => session.status === 'connected');

  // Auto-select first connected session
  useEffect(() => {
    if (connectedSessions.length > 0 && !selectedSession) {
      setSelectedSession(connectedSessions[0]);
    }
  }, [connectedSessions, selectedSession]);

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading sessions...</p>
      </div>
    );
  }

  if (connectedSessions.length === 0) {
    return (
      <Card className="h-64">
        <CardHeader className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>No Connected Sessions</CardTitle>
          <CardDescription>
            You need to connect a WhatsApp session before you can view conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <a href="/home/settings/whatsapp">Connect WhatsApp</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Session Selector */}
      {connectedSessions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select WhatsApp Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {connectedSessions.map((session) => (
                <Button
                  key={session.id}
                  variant={selectedSession?.id === session.id ? 'default' : 'outline'}
                  onClick={() => setSelectedSession(session)}
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {session.session_name}
                  {session.phone_number && (
                    <Badge variant="secondary" className="ml-2">
                      {session.phone_number}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Conversations List */}
        <div className="w-1/3 min-w-[300px]">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            isLoading={conversationsLoading}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          <ChatWindow
            conversation={selectedConversation}
            sessionId={selectedSession?.id}
          />
        </div>
      </div>
    </div>
  );
}
