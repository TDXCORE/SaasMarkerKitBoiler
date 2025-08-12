'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Badge } from '@kit/ui/badge';

import { WhatsAppSession } from '~/lib/whatsapp/types';
import { QRCodeDisplay } from './qr-code-display';
import { SessionStatus } from './session-status';

interface WhatsAppSettingsContainerProps {
  userId: string;
}

export function WhatsAppSettingsContainer({ userId }: WhatsAppSettingsContainerProps) {
  const [sessionName, setSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['whatsapp-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/whatsapp/session/status');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionName: string) => {
      const response = await fetch('/api/whatsapp/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create session');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessions'] });
      setSessionName('');
      setIsCreating(false);
      toast.success('Session created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreateSession = () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }
    createSessionMutation.mutate(sessionName.trim());
  };

  const sessions: WhatsAppSession[] = sessionsData?.sessions || [];

  return (
    <div className="space-y-6">
      {/* Create New Session */}
      <Card>
        <CardHeader>
          <CardTitle>Create New WhatsApp Session</CardTitle>
          <CardDescription>
            Create a new WhatsApp session to connect your phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isCreating ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionName">Session Name</Label>
                <Input
                  id="sessionName"
                  placeholder="Enter a name for your session"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateSession();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending || !sessionName.trim()}
              >
                {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">Session created! Scan the QR code below.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Your WhatsApp Sessions</CardTitle>
          <CardDescription>
            Manage your existing WhatsApp connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sessions found. Create your first session above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{session.session_name}</h3>
                      {session.phone_number && (
                        <p className="text-sm text-muted-foreground">
                          {session.phone_number}
                        </p>
                      )}
                    </div>
                    <SessionStatus status={session.status || 'disconnected'} />
                  </div>

                  {session.status === 'connecting' && session.qr_code && (
                    <QRCodeDisplay qrCode={session.qr_code} />
                  )}

                  {session.status === 'connected' && session.last_connected_at && (
                    <p className="text-sm text-muted-foreground">
                      Last connected: {new Date(session.last_connected_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
