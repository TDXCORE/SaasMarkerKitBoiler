import { use } from 'react';

import { PageBody } from '@kit/ui/page';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { ChatContainer } from './_components/chat-container';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = 'WhatsApp Chat';

  return {
    title,
  };
};

function ChatPage() {
  const user = use(requireUserInServerComponent());

  return (
    <PageBody>
      <div className={'flex w-full flex-1 flex-col h-full'}>
        <div className="mb-4">
          <h1 className="text-2xl font-bold">WhatsApp Chat</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp conversations
          </p>
        </div>
        
        <ChatContainer userId={user.id} />
      </div>
    </PageBody>
  );
}

export default withI18n(ChatPage);
