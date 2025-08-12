import { use } from 'react';

import { PageBody } from '@kit/ui/page';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { WhatsAppSettingsContainer } from './_components/whatsapp-settings-container';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = 'WhatsApp Settings';

  return {
    title,
  };
};

function WhatsAppSettingsPage() {
  const user = use(requireUserInServerComponent());

  return (
    <PageBody>
      <div className={'flex w-full flex-1 flex-col lg:max-w-4xl'}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">WhatsApp Settings</h1>
          <p className="text-muted-foreground">
            Configure your WhatsApp connection and manage sessions
          </p>
        </div>
        
        <WhatsAppSettingsContainer userId={user.id} />
      </div>
    </PageBody>
  );
}

export default withI18n(WhatsAppSettingsPage);
