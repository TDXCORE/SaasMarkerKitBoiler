# Product Requirements Document (PRD)
## WhatsApp Web JS Integration for SaaS Boilerplate

### 1. Executive Summary

This PRD outlines the integration of WhatsApp Web JS into the existing SaaS boilerplate to enable WhatsApp messaging capabilities. The solution will allow users to connect their WhatsApp accounts via QR code scanning and manage all conversations through a web interface.

### 2. Project Overview

**Project Name:** WhatsApp Web JS Integration  
**Version:** 1.0  
**Date:** January 8, 2025  
**Status:** In Development  

**Objective:** Integrate WhatsApp Web JS library to provide a complete WhatsApp messaging solution within the SaaS platform, enabling users to manage WhatsApp conversations directly from the web application.

### 3. Technical Stack

- **Frontend:** Next.js 15.3.2, React 19.1.0, TypeScript
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (via Supabase)
- **WhatsApp Integration:** whatsapp-web.js v1.25.0
- **QR Code Generation:** qrcode v1.5.4
- **UI Components:** Shadcn/UI, Tailwind CSS
- **State Management:** TanStack Query v5.77.2

### 4. Database Schema

#### 4.1 WhatsApp Sessions Table
```sql
CREATE TABLE whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    phone_number TEXT,
    qr_code TEXT,
    status TEXT CHECK (status IN ('disconnected', 'connecting', 'connected', 'error')) DEFAULT 'disconnected',
    session_data JSONB,
    last_connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, session_name)
);
```

#### 4.2 WhatsApp Conversations Table
```sql
CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL,
    contact_name TEXT,
    contact_number TEXT,
    is_group BOOLEAN DEFAULT FALSE,
    last_message_at TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, chat_id)
);
```

#### 4.3 WhatsApp Messages Table
```sql
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    from_number TEXT,
    to_number TEXT,
    message_type TEXT CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document')),
    content TEXT,
    media_url TEXT,
    is_from_me BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, message_id)
);
```

### 5. API Endpoints

#### 5.1 Session Management
- **POST** `/api/whatsapp/session/create` - Create new WhatsApp session
- **GET** `/api/whatsapp/session/status` - Get session status and list
- **PUT** `/api/whatsapp/session/status` - Update session status
- **DELETE** `/api/whatsapp/session/{id}` - Delete session
- **POST** `/api/whatsapp/session/{id}/connect` - Initiate connection
- **POST** `/api/whatsapp/session/{id}/disconnect` - Disconnect session

#### 5.2 Conversation Management
- **GET** `/api/whatsapp/conversations` - List conversations for session
- **GET** `/api/whatsapp/conversations/{id}` - Get specific conversation
- **PUT** `/api/whatsapp/conversations/{id}` - Update conversation (mark as read)

#### 5.3 Message Management
- **GET** `/api/whatsapp/messages` - Get messages for conversation
- **POST** `/api/whatsapp/messages/send` - Send message
- **GET** `/api/whatsapp/messages/{id}` - Get specific message

#### 5.4 WebSocket Events
- **session:qr** - QR code generated
- **session:ready** - Session connected
- **session:disconnected** - Session disconnected
- **message:received** - New message received
- **message:sent** - Message sent confirmation

### 6. User Interface Components

#### 6.1 WhatsApp Settings Module (`/home/settings/whatsapp`)

**Features:**
- Create new WhatsApp sessions
- Display QR codes for connection
- Show session status (Connected, Connecting, Disconnected, Error)
- Manage multiple sessions
- Session configuration options

**Components:**
- `WhatsAppSettingsContainer` - Main container
- `QRCodeDisplay` - QR code display component
- `SessionStatus` - Status badge component
- `SessionList` - List of user sessions

#### 6.2 Chat Module (`/home/chat`)

**Features:**
- Session selector (if multiple sessions)
- Conversation list with search and filters
- Real-time chat interface
- Message sending and receiving
- Media message support
- Unread message indicators

**Components:**
- `ChatContainer` - Main chat interface
- `ConversationList` - List of conversations
- `ChatWindow` - Message display and input
- `MessageBubble` - Individual message component
- `MessageInput` - Message composition area

### 7. WhatsApp Web JS Integration

#### 7.1 Client Configuration
```typescript
interface WhatsAppClientConfig {
  sessionId: string;
  accountId: string;
  onQR?: (qr: string) => void;
  onReady?: () => void;
  onMessage?: (message: any) => void;
  onDisconnected?: (reason: string) => void;
  onAuthFailure?: (message: string) => void;
}
```

#### 7.2 Session Management
- Session persistence using local storage
- Automatic reconnection handling
- QR code generation and display
- Session state synchronization with database

#### 7.3 Message Handling
- Real-time message reception
- Message type detection (text, media)
- Media file handling and storage
- Message status tracking (sent, delivered, read)

### 8. Security Considerations

#### 8.1 Authentication & Authorization
- User must be authenticated to access WhatsApp features
- Session isolation per user account
- API endpoint protection with user validation

#### 8.2 Data Protection
- Encrypted session data storage
- Secure media file handling
- Rate limiting on API endpoints
- Input validation and sanitization

#### 8.3 WhatsApp Compliance
- Respect WhatsApp's terms of service
- Implement proper session management
- Handle rate limiting appropriately
- User consent for data processing

### 9. Implementation Phases

#### Phase 1: Core Infrastructure (Completed)
- [x] Database schema creation
- [x] Basic API endpoints
- [x] TypeScript types and interfaces
- [x] UI component structure

#### Phase 2: Session Management
- [ ] WhatsApp client initialization
- [ ] QR code generation and display
- [ ] Session state management
- [ ] Connection/disconnection handling

#### Phase 3: Messaging Core
- [ ] Message reception and storage
- [ ] Conversation management
- [ ] Real-time updates via WebSocket
- [ ] Message sending functionality

#### Phase 4: User Interface
- [ ] Complete chat interface
- [ ] Conversation list with search
- [ ] Message composition area
- [ ] Media message support

#### Phase 5: Advanced Features
- [ ] Multiple session support
- [ ] Message search and filtering
- [ ] Export/backup functionality
- [ ] Analytics and reporting

### 10. Technical Requirements

#### 10.1 Server Requirements
- Node.js 18+ environment
- Sufficient storage for media files
- WebSocket support for real-time features
- Chromium browser for WhatsApp Web JS

#### 10.2 Client Requirements
- Modern web browser with WebSocket support
- Stable internet connection
- Camera access for QR code scanning (mobile)

#### 10.3 Dependencies
```json
{
  "whatsapp-web.js": "^1.25.0",
  "qrcode": "^1.5.4",
  "@types/qrcode": "^1.5.5"
}
```

### 11. Testing Strategy

#### 11.1 Unit Testing
- API endpoint testing
- Component testing with Jest/React Testing Library
- Database operation testing

#### 11.2 Integration Testing
- WhatsApp Web JS integration testing
- End-to-end message flow testing
- Session management testing

#### 11.3 User Acceptance Testing
- QR code scanning flow
- Message sending/receiving
- Multi-session management
- Error handling scenarios

### 12. Deployment Considerations

#### 12.1 Environment Variables
```env
WHATSAPP_SESSION_SECRET=your_session_secret
WHATSAPP_MEDIA_STORAGE_PATH=/path/to/media
WHATSAPP_MAX_SESSIONS_PER_USER=5
```

#### 12.2 Production Setup
- Chromium installation on server
- Media storage configuration
- WebSocket server setup
- Session cleanup jobs

### 13. Monitoring & Analytics

#### 13.1 Key Metrics
- Active sessions count
- Message volume per day
- Connection success rate
- Error rates and types

#### 13.2 Logging
- Session connection/disconnection events
- Message sending/receiving logs
- Error tracking and alerting
- Performance monitoring

### 14. Future Enhancements

#### 14.1 Planned Features
- WhatsApp Business API integration
- Automated message templates
- Chatbot integration
- Advanced analytics dashboard

#### 14.2 Scalability Considerations
- Multi-server session distribution
- Database sharding for large message volumes
- CDN for media file delivery
- Horizontal scaling support

### 15. Risk Assessment

#### 15.1 Technical Risks
- WhatsApp Web JS library updates breaking compatibility
- Session stability issues
- Performance degradation with high message volume

#### 15.2 Business Risks
- WhatsApp policy changes
- Rate limiting affecting user experience
- Compliance and legal considerations

#### 15.3 Mitigation Strategies
- Regular library updates and testing
- Fallback mechanisms for session failures
- Monitoring and alerting systems
- Legal review of WhatsApp usage

### 16. Success Criteria

#### 16.1 Technical Success
- 99% session connection success rate
- < 2 second message delivery time
- Support for 1000+ concurrent sessions
- Zero data loss incidents

#### 16.2 User Experience Success
- Intuitive QR code connection process
- Real-time message synchronization
- Responsive chat interface
- Reliable multi-session management

### 17. Conclusion

This PRD provides a comprehensive roadmap for integrating WhatsApp Web JS into the SaaS boilerplate. The implementation will enable users to manage WhatsApp conversations directly from the web application, providing a seamless messaging experience while maintaining security and compliance standards.

The modular architecture ensures scalability and maintainability, while the phased implementation approach allows for iterative development and testing. Regular monitoring and user feedback will guide future enhancements and optimizations.
