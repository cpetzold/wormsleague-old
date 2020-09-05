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

type ParsedGame = {
  startedAt: Date;
  duration: number;
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
    result,
    awards,
  ] = log.split("\r\n\r\n").map((s) => s.split("\r\n"));

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

  const parsedResult = tmpl(result[0], "{{winner}} wins");
  if (parsedResult) {
    const { username } = find<ParsedGamePlayer>(
      propEq("teamName", parsedResult.winner),
      values(playersMap)
    );
    playersMap[username].won = true;
  }

  return {
    startedAt,
    duration,
    players: values(mergeWith(merge, playersMap, playerTimesMap)),
  };
}

export function parseDuration(str: string) {
  const { h, m, s, ms } = tmpl(
    str,
    `{{h}}:{{m}}:{{s}}${str.includes(".") ? ".{{ms}}" : ""}`
  );
  return (
    (parseInt(h) * 60 * 60 + parseInt(m) * 60 + parseInt(s)) * 1000 +
    parseInt(ms ? ms : 0)
  );
}
