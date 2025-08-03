'use strict';

const assert = require('assert');

const eventutils = require('./eventutils');
const utils = require('./utils');
const source_helper = require('./source_helper');
const {is_bundesliga, max_game_count, league_scoring, unify_team_name} = require('./eventutils');

const MATCH_NAMES_BUNDESLIGA = {
	'1': 'HD1',
	'2': 'DD',
	'3': 'HD2',
	'4': 'HE1',
	'5': 'DE',
	'6': 'GD',
	'7': 'HE2',
};
const MATCH_NAMES_8 = {
	'1': 'HD1',
	'2': 'HD2',
	'3': 'DD',
	'4': 'HE1',
	'5': 'HE2',
	'6': 'HE3',
	'7': 'DE',
	'8': 'GD',
};


function _parse_players(player_str) {
	if (player_str === '') {
		return [];
	}

	const doubles_m = /([^,/]+), ([^,/]+)\/([^,/]+), ([^,/]+)/.exec(player_str);
	if (doubles_m) {
		return [{
			name: doubles_m[2] + ' ' + doubles_m[1],
		}, {
			name: doubles_m[4] + ' ' + doubles_m[3],
		}];
	}

	const singles_m = /([^,/]+),\s*([^,/]+)/.exec(player_str);
	if (singles_m) {
		return [{
			name: singles_m[2] + ' ' + singles_m[1],
		}];
	}

	const doubles_simple_m = /([^/]+)\/([^/]+)/.exec(player_str);
	if (doubles_simple_m) {
		return [
			{name: doubles_simple_m[1].trim()},
			{name: doubles_simple_m[2].trim()},
		];
	}

	// Hopefully just a simple singles player
	if (!player_str.includes(',') && !player_str.includes('/')) {
		return [{name: player_str}];
	}

	throw new Error('Unparsable: ' + JSON.stringify(player_str));
}

function parse(src, data) {
	const {event} = data;
	assert(event);

	const mscore = event.score;

	const scoring = league_scoring(src.league_key) || '5x11_15^90';
	const MATCH_NAMES = is_bundesliga(src.league_key) ? MATCH_NAMES_BUNDESLIGA : MATCH_NAMES_8;
	const GAME_COUNT = max_game_count(scoring);

	const courts = [{label: '1'}, {label: '2'}];
	const matches = event.matches.map(btde_match => {
		const res = {
			name: btde_match.dis,
			score: [],
		};

		const court_id = btde_match.court;
		if (court_id === 1) {
			courts[0].match_id = res.name;
		} else if (court_id === 2) {
			courts[1].match_id = res.name;
		}

		// Players
		let players = (btde_match.players || []).map(_parse_players);
		if (players.length !== 2) {
			players = [[], []];
		}
		// Swap mixed (wrong order in btde)
		if (res.name === 'GD') {
			for (const team_players of players) {
				if (team_players.length === 2) {
					team_players.reverse();
				}
			}
		}
		if ((players[0].length > 0) || (players[1].length > 0)) {
			res.players = players;
		}

		// Score
		res.score = btde_match.points;

		// Server
		if (btde_match.service && btde_match.service.length == 2) {
			res.serving = btde_match.service[0] ? 0 : 1;
		}

		return res;
	});
	eventutils.unify_order(matches, src.league_key);

	const res = {
		mscore,
		matches,
		scoring,
		courts,
	};


	if (event.teams && event.teams.length === 2 && event.teams[0] && event.teams[1]) {
		res.team_names = event.teams.map(unify_team_name);
	}

	return res;
}

function run_once(cfg, src, sh, cb) {
	const { btde_account } = src;
	assert(btde_account, `Ǹo btde_account setting for ${JSON.stringify(src)}`);
	assert(!btde_account.includes('/'));
	const url = `https://badmintonticker.de/ticker/api/?team=${encodeURIComponent(btde_account)}&uts=0&lh=0&lg=0`;

	if (cfg('verbosity', 0) > 2) {
		console.log('[btde] Downloading ' + url); // eslint-disable-line no-console
	}

	utils.download_page(url, (err, _req, txt) => {
		if (err) return cb(err);

		let data;
		try {
			data = JSON.parse(txt);
		} catch (e) {
			return cb(e);
		}
		let event;
		try {
			event = parse(src, data);
		} catch (e) {
			return cb(e);
		}
		event.link = `https://${encodeURIComponent(btde_account)}.badmintonticker.de/`;
		source_helper.copy_props(event, src);
		sh.on_new_full(event);
		return cb();
	});
}

function setup_tm(tm, home_team) {
	if (!tm.btde_account) {
		tm.btde_account = home_team.btde_account;
	}
}

module.exports = {
	run_once,
	setup_tm,

	// Testing only
	_parse: parse,
};
