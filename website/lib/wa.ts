import * as tmpl from "reverse-string-template";

import {
  drop,
  filter,
  find,
  has,
  indexBy,
  map,
  merge,
  mergeWith,
  prop,
  propEq,
  values,
} from "ramda";

type ParsedGamePlayer = {
  username: string;
  teamName: string;
  teamColor: string;
  turnCount: number;
  turnTime: number;
  retreatTime: number;
  won: boolean;
};

type GameType = "match" | "round";

type ParsedGame = {
  startedAt: Date;
  duration: number;
  gameType: GameType;
  players: ParsedGamePlayer[];
};

export function parseGameLog(log: string): ParsedGame {
  var [
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

  const [
    s_,
    winner,
    gameType,
  ] = /\r\n\r\n([^\r\n]+) wins the (match(?=!)|round(?=\.)).\r\n\r\n/.exec(log);

  const startedAtLine = info[0].startsWith("Game Started at")
    ? info[0]
    : info[1];
  const startedAt = new Date(startedAtLine.replace("Game Started at ", ""));
  const playersMap: { [username: string]: ParsedGamePlayer } = indexBy(
    prop("username"),
    filter(
      has("username"),
      map(
        (s) => ({
          ...tmpl(s, '{{teamColor}}: "{{username}}" as "{{teamName}}"', {
            whitespace: 1,
          }),
          won: false,
        }),
        teams
      )
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

  if (winner) {
    const { username } = find<ParsedGamePlayer>(
      propEq("teamName", winner),
      values(playersMap)
    );
    playersMap[username].won = true;
  }

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
