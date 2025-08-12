-- =====================================================
-- COMPLETE DATABASE SETUP FOR SAAS MARKERKIT + WHATSAPP
-- Execute this script in Supabase SQL Editor
-- =====================================================

-- Create a private Makerkit schema
CREATE SCHEMA IF NOT EXISTS kit;

CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA kit;

-- =====================================================
-- ACCOUNTS TABLE (Base requirement)
-- =====================================================

-- Accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id          UUID UNIQUE  NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(320) UNIQUE,
    updated_at  TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE,
    created_by  UUID REFERENCES auth.users,
    updated_by  UUID REFERENCES auth.users,
    picture_url VARCHAR(1000),
    public_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    PRIMARY KEY (id)
);

-- Enable RLS on the accounts table
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY accounts_read ON public.accounts FOR SELECT TO authenticated 
    USING ((SELECT auth.uid()) = id);

CREATE POLICY accounts_update ON public.accounts FOR UPDATE TO authenticated 
    USING ((SELECT auth.uid()) = id) 
    WITH CHECK ((SELECT auth.uid()) = id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO authenticated, service_role;

-- Function to protect account fields
CREATE OR REPLACE FUNCTION kit.protect_account_fields() RETURNS TRIGGER AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') THEN
        IF new.id <> old.id OR new.email <> old.email THEN
            RAISE EXCEPTION 'You do not have permission to update this field';
        END IF;
    END IF;
    RETURN NEW;
END
$$ LANGUAGE plpgsql SET search_path = '';

-- Trigger to protect account fields
CREATE TRIGGER protect_account_fields
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION kit.protect_account_fields();

-- Function to handle user email updates
CREATE OR REPLACE FUNCTION kit.handle_update_user_email() RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    UPDATE public.accounts SET email = new.email WHERE id = new.id;
    RETURN new;
END;
$$;

-- Trigger for user email updates
CREATE TRIGGER "on_auth_user_updated"
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE kit.handle_update_user_email();

-- Function to setup new user account
CREATE OR REPLACE FUNCTION kit.new_user_created_setup() RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    user_name   text;
    picture_url text;
BEGIN
    IF new.raw_user_meta_data ->> 'name' IS NOT NULL THEN
        user_name := new.raw_user_meta_data ->> 'name';
    END IF;

    IF user_name IS NULL AND new.email IS NOT NULL THEN
        user_name := split_part(new.email, '@', 1);
    END IF;

    IF user_name IS NULL THEN
        user_name := '';
    END IF;

    IF new.raw_user_meta_data ->> 'avatar_url' IS NOT NULL THEN
        picture_url := new.raw_user_meta_data ->> 'avatar_url';
    ELSE
        picture_url := null;
    END IF;

    INSERT INTO public.accounts(id, name, picture_url, email)
    VALUES (new.id, user_name, picture_url, new.email);

    RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE kit.new_user_created_setup();

-- =====================================================
-- WHATSAPP TABLES
-- =====================================================

-- Create WhatsApp sessions table
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
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
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
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
CREATE TABLE IF NOT EXISTS whatsapp_messages (
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

-- Enable RLS (Row Level Security) for WhatsApp tables
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
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_account_id ON whatsapp_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_session_id ON whatsapp_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_chat_id ON whatsapp_conversations(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);

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

-- Grant permissions on WhatsApp tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE whatsapp_sessions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE whatsapp_conversations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE whatsapp_messages TO authenticated, service_role;

-- =====================================================
-- STORAGE SETUP (Optional but recommended)
-- =====================================================

-- Account Image bucket
INSERT INTO storage.buckets (id, name, PUBLIC)
VALUES ('account_image', 'account_image', true)
ON CONFLICT (id) DO NOTHING;

-- Function: get the storage filename as a UUID
CREATE OR REPLACE FUNCTION kit.get_storage_filename_as_uuid(name text) RETURNS uuid
    SET search_path = '' AS $$
BEGIN
    RETURN replace(storage.filename(name), concat('.', storage.extension(name)), '')::uuid;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION kit.get_storage_filename_as_uuid (text) TO authenticated, service_role;

-- RLS policies for storage bucket account_image
CREATE POLICY account_image ON storage.objects FOR ALL USING (
    bucket_id = 'account_image'
        AND (kit.get_storage_filename_as_uuid(name) = auth.uid())
    )
    WITH CHECK (
    bucket_id = 'account_image'
        AND (kit.get_storage_filename_as_uuid(name) = auth.uid())
    );
