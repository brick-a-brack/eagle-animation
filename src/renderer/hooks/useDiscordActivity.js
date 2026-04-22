import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function useDiscordActivity(options = { description: null, actionIcon: null, actionTitle: null }) {
  const { t } = useTranslation();
  useEffect(() => {
    (async () => {
      await window.EA('DISCORD_ACTIVITY', {
        description: options.description || null,
        actionIcon: options.actionIcon || null,
        actionTitle: options.actionTitle || null,
        applicationTitle: t('Free Stop Motion Software'),
      });
    })();
  }, [options]);

  return null;
}

export default useDiscordActivity;
