import { IS_DEV } from '@config-web';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function useDiscordActivity(options = { description: null, actionIcon: null, actionTitle: null }) {
  const { t } = useTranslation();
  const { description = null, actionIcon = null, actionTitle = null } = options;

  useEffect(() => {
    if (IS_DEV) {
      return;
    }

    window.EA('DISCORD_ACTIVITY', {
      description: description || null,
      actionIcon: actionIcon || null,
      actionTitle: actionTitle || null,
      applicationTitle: t('Free Stop Motion Software'),
    });
  }, [description, actionIcon, actionTitle, t]);

  return null;
}

export default useDiscordActivity;
