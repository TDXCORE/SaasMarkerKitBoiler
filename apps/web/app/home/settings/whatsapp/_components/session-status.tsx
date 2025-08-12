'use client';

import { Badge } from '@kit/ui/badge';
import { SessionStatus as SessionStatusType } from '~/lib/whatsapp/types';

interface SessionStatusProps {
  status: SessionStatusType;
}

export function SessionStatus({ status }: SessionStatusProps) {
  const getStatusConfig = (status: SessionStatusType) => {
    switch (status) {
      case 'connected':
        return {
          variant: 'default' as const,
          label: 'Connected',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        };
      case 'connecting':
        return {
          variant: 'secondary' as const,
          label: 'Connecting',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          label: 'Error',
          className: 'bg-red-100 text-red-800 hover:bg-red-100'
        };
      case 'disconnected':
      default:
        return {
          variant: 'outline' as const,
          label: 'Disconnected',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={config.className}
    >
      {config.label}
    </Badge>
  );
}
