import {
  drop,
  filter,
  has,
  indexBy,
  map,
  merge,
  mergeWith,
  prop,
  values,
} from "ramda";

import tmpl from "reverse-string-template";

type ParsedGamePlayer = {
  username: string;
  teamName: string;
  teamColor: string;
  turnCount: number;
  turnTime: number;
  retreatTime: number;
  won: boolean;
  local: boolean;
  host: boolean;
};

type GameType = "match" | "round";

type ParsedGame = {
  startedAt: Date;
  duration: number;
  gameType: GameType;
  players: ParsedGamePlayer[];
};

export function parseGameLog(log: string): ParsedGame {
  const [
    info,
    teams,
    events,
    teamTimeTotals,
    roundCount,
    timeTotals,
    damageTotals,
    result,
    awards,
  ] = log.split("\r\n\r\n").map((s) => s.split("\r\n"));

  const winnerMatch = /\r\n\r\n([^\r\n]+) wins the (match(?=!)|round(?=\.)).\r\n\r\n/.exec(
    log
  );
  const winner = winnerMatch && winnerMatch[1];
  const gameType = winnerMatch && winnerMatch[2];

  const startedAtLine = info[0].startsWith("Game Started at")
    ? info[0]
    : info[1];
  const startedAt = new Date(startedAtLine.replace("Game Started at ", ""));

  const playersMap: { [username: string]: ParsedGamePlayer } = indexBy(
    prop("username"),
    filter(
      has("username"),
      map((s) => {
        const { teamColor, username, teamName, flags } = tmpl(
          s,
          '{{teamColor}}: "{{username}}" as "{{teamName}}"{{flags}}',
          {
            whitespace: 1,
          }
        );

        return {
          username,
          won: winner === teamName,
          local: flags.includes("Local Player"),
          host: flags.includes("Host"),
          teamName,
          teamColor,
          turnCount: 0,
          turnTime: 0,
          retreatTime: 0,
        };
      }, teams)
    )
  );

  const playerTimesMap = indexBy(
    prop("username"),
    map((s) => {
      const { username, turnTime, retreatTime, turnCount } = tmpl(
        s,
        "{{teamName}} ({{username}}): Turn: {{turnTime}}, Retreat: {{retreatTime}}, Total: {{totalTime}}, Turn count: {{turnCount}}",
        { whitespace: 1 }
      );

      return {
        username,
        turnTime: parseDuration(turnTime),
        retreatTime: parseDuration(retreatTime),
        turnCount: parseInt(turnCount),
      };
    }, drop(1, teamTimeTotals))
  );

  const { durationString } = tmpl(
    timeTotals[0],
    "Round time: {{ durationString }}"
  );
  const duration = parseDuration(durationString);

  return {
    startedAt,
    duration,
    gameType: gameType as GameType,
    players: values(mergeWith(merge, playersMap, playerTimesMap)),
  };
}

export function parseDuration(str: string) {
  const { h, m, s, cs } = tmpl(
    str,
    `{{h}}:{{m}}:{{s}}${str.includes(".") ? ".{{cs}}" : ""}`
  );
  return (
    (parseInt(h) * 60 * 60 + parseInt(m) * 60 + parseInt(s)) * 1000 +
    parseInt(cs ? cs : 0) * 10
  );
}
