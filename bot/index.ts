import discordIrc from "discord-irc";

const GENERAL_CHANNEL_ID = "752615473111236718";

const commonConfig = {
  nickname: "|",
  discordToken: process.env.BOT_TOKEN,
  webhooks: {
    [GENERAL_CHANNEL_ID]: process.env.BOT_WEBHOOK,
  },
  format: {
    ircText: "{$displayUsername}> {$text}",
    urlAttachment: "{$displayUsername}> {$attachmentURL}",
  },
};

discordIrc([
  {
    ...commonConfig,
    server: "wormnet1.team17.com",
    ircOptions: {
      password: "ELSILRACLIHP",
    },
    channelMapping: {
      [GENERAL_CHANNEL_ID]: "#partytime",
    },
    ircNickColor: false,
  },
  {
    ...commonConfig,
    server: "NuclearFallout.WA.US.GameSurge.net",
    discordToken: process.env.BOT_TOKEN,
    channelMapping: {
      [GENERAL_CHANNEL_ID]: "#wormsleague",
    },
  },
]);
