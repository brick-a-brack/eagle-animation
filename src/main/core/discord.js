import { Client } from '@xhayper/discord-rpc';
import { ActivityType } from 'discord-api-types/v10';

// Registered by Brickfilms.com
const client = new Client({
  clientId: '1496503871919493131',
});

let isReady = null;
let pendingActivity = null;

const startedAt = new Date();

export const setDiscordActivity = (activityInfo) => {
  const activity = {
    ...activityInfo,
    startTimestamp: startedAt,
    type: ActivityType.Playing,
    largeImageKey: 'logo',
  };

  if (isReady) {
    client.user?.setActivity(activity);
  } else {
    pendingActivity = activity;
  }
};

client.on('ready', () => {
  isReady = true;
  if (pendingActivity) {
    client.user?.setActivity(pendingActivity);
    pendingActivity = null;
  }
});

const attemptLogin = () => {
  client.login().catch(() => {
    setTimeout(attemptLogin, 60000);
  });
};

attemptLogin();
