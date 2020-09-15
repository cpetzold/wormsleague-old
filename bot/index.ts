import * as Discord from "discord.js";

import discordIrc from "discord-irc";

const client = new Discord.Client();

client.on("ready", () => {
  console.log("I am ready!");
});

client.on("message", (message) => {
  if (message.author.id === client.user.id) {
    return;
  }

  const waLinkMatch = /wa:\/\/(\S+)/.exec(message.content);

  if (waLinkMatch) {
    const [_m, waLink] = waLinkMatch;
    message.channel.send({
      embed: {
        title: `Join wa://${waLink}`,
        url: `https://wormsleague.com/api/wa/${encodeURIComponent(waLink)}`,
      },
    });
  }
});

client.login(process.env.BOT_TOKEN);

const GENERAL_CHANNEL_ID = "752615473111236718";

const commonConfig = {
  nickname: "WormsLeague",
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
