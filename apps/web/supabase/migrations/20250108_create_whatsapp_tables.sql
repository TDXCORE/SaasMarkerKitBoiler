-- Create WhatsApp sessions table
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  session_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  qr_code TEXT,
  status VARCHAR(50) DEFAULT 'disconnected', -- disconnected, connecting, connected, error
  session_data JSONB,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, session_name)
);

-- Create WhatsApp conversations table
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  chat_id VARCHAR(255) NOT NULL, -- WhatsApp chat ID
  contact_name VARCHAR(255),
  contact_number VARCHAR(20),
  is_group BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, chat_id)
);

-- Create WhatsApp messages table
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  message_id VARCHAR(255) NOT NULL, -- WhatsApp message ID
  from_number VARCHAR(20),
  to_number VARCHAR(20),
  message_type VARCHAR(50), -- text, image, audio, video, document
  content TEXT,
  media_url TEXT,
  is_from_me BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, message_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for whatsapp_sessions
CREATE POLICY "Users can view their own WhatsApp sessions" ON whatsapp_sessions
  FOR SELECT USING (account_id = auth.uid());

CREATE POLICY "Users can insert their own WhatsApp sessions" ON whatsapp_sessions
  FOR INSERT WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can update their own WhatsApp sessions" ON whatsapp_sessions
  FOR UPDATE USING (account_id = auth.uid());

CREATE POLICY "Users can delete their own WhatsApp sessions" ON whatsapp_sessions
  FOR DELETE USING (account_id = auth.uid());

-- Create RLS policies for whatsapp_conversations
CREATE POLICY "Users can view conversations from their sessions" ON whatsapp_conversations
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM whatsapp_sessions WHERE account_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversations for their sessions" ON whatsapp_conversations
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM whatsapp_sessions WHERE account_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations from their sessions" ON whatsapp_conversations
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM whatsapp_sessions WHERE account_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete conversations from their sessions" ON whatsapp_conversations
  FOR DELETE USING (
    session_id IN (
      SELECT id FROM whatsapp_sessions WHERE account_id = auth.uid()
    )
  );

-- Create RLS policies for whatsapp_messages
CREATE POLICY "Users can view messages from their conversations" ON whatsapp_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT c.id FROM whatsapp_conversations c
      JOIN whatsapp_sessions s ON c.session_id = s.id
      WHERE s.account_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for their conversations" ON whatsapp_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM whatsapp_conversations c
      JOIN whatsapp_sessions s ON c.session_id = s.id
      WHERE s.account_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their conversations" ON whatsapp_messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT c.id FROM whatsapp_conversations c
      JOIN whatsapp_sessions s ON c.session_id = s.id
      WHERE s.account_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON whatsapp_messages
  FOR DELETE USING (
    conversation_id IN (
      SELECT c.id FROM whatsapp_conversations c
      JOIN whatsapp_sessions s ON c.session_id = s.id
      WHERE s.account_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_sessions_account_id ON whatsapp_sessions(account_id);
CREATE INDEX idx_whatsapp_conversations_session_id ON whatsapp_conversations(session_id);
CREATE INDEX idx_whatsapp_conversations_chat_id ON whatsapp_conversations(chat_id);
CREATE INDEX idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_whatsapp_sessions_updated_at BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at BEFORE UPDATE ON whatsapp_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
