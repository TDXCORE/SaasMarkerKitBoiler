import { Tables, TablesInsert, TablesUpdate } from '../database.types';

// Database types
export type WhatsAppSession = Tables<'whatsapp_sessions'>;
export type WhatsAppConversation = Tables<'whatsapp_conversations'>;
export type WhatsAppMessage = Tables<'whatsapp_messages'>;

export type WhatsAppSessionInsert = TablesInsert<'whatsapp_sessions'>;
export type WhatsAppConversationInsert = TablesInsert<'whatsapp_conversations'>;
export type WhatsAppMessageInsert = TablesInsert<'whatsapp_messages'>;

export type WhatsAppSessionUpdate = TablesUpdate<'whatsapp_sessions'>;
export type WhatsAppConversationUpdate = TablesUpdate<'whatsapp_conversations'>;
export type WhatsAppMessageUpdate = TablesUpdate<'whatsapp_messages'>;

// WhatsApp Web JS types
export interface WhatsAppClientConfig {
  sessionId: string;
  accountId: string;
  onQR?: (qr: string) => void;
  onReady?: () => void;
  onMessage?: (message: any) => void;
  onDisconnected?: (reason: string) => void;
  onAuthFailure?: (message: string) => void;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  number: string;
  isGroup: boolean;
  profilePicUrl?: string;
}

export interface WhatsAppMessageData {
  id: string;
  from: string;
  to: string;
  body: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  timestamp: number;
  isFromMe: boolean;
  mediaUrl?: string;
}

export type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface QRCodeData {
  qr: string;
  sessionId: string;
}

export interface SessionStatusUpdate {
  sessionId: string;
  status: SessionStatus;
  phoneNumber?: string;
  lastConnectedAt?: string;
}
