'use strict';

var extradata = (function() {

var TEAM_COLORS = {
	'Beuel': '#ffed00',
	'Bischmisheim': '#1c388f',
	'BV Mülheim': '#ff423f',
	'BW Solingen': '#cbff81', // STC BW Solingen
	'CfB Köln': '#0f8a3c',
	'Dillingen': '#164f89',
	'Dortelweil': '#f9f152',
	'EBT Berlin': '#7688ad',
	'Fischbach': '#d9251d',
	'Friedrichsdorf': '#008131',
	'Freystadt': '#ff161d',
	'Geretsried': '#0c8f78',
	'Gladbecker FC': '#8f2424',
	'GW Mülheim': '#1bb332',
	'Hofheim': '#181d4b',
	'Hohenlimburg': '#0ebbff',
	'Horner': '#f4b692', // Hamburg Horner TV
	'Hövelhof': '#ce1b28', // BX Phönix Hövelhof
	'Jena': '#3466a4', // SV GutsMuths Jena
	'Lüdinghausen': '#ff1400',
	'Maintal': '#104cba', // 1. BV Maintal
	'Marktheidenfeld': '#1c3759',
	'Neubiberg': '#e2001a', // TSV Neubiberg/Ottobrunn 1920
	'Neuhausen': '#02c0ff',
	'Neuhofen': '#c70e3d',
	'Offenburg': '#0671fb',
	'Peine': '#41b768',
	'Refrath': '#1e3a8e',
	'Remagen': '#1f355e',
	'Schorndorf': '#eb1c24',
	'Schwanheim': '#100c6c',
	'Sterkrade': '#fefa42',
	'Solingen': '#14a4db',
	'Trittau': '#0060a1',
	'Wesel': '#ed1a24',
	'Wipperfeld': '#ff2149',
	'Wittorf': '#0091ff',
};
function get_color(team_name) {
	for (var keyword in TEAM_COLORS) {
		if (team_name.includes(keyword)) {
			return TEAM_COLORS[keyword];
		}
	}
	return '#ddddff';
}

var LOGOS = [
	'bcbeuel',
	'bcbsaarbruecken',
	'bchohenlimburg',
	'bcoffenburg',
	'bcpreussenpark',
	'bcrecklinghausen', // jpg logo
	'bcremagen',
	'bcwipperfeld',
	'bspfrneusatz',
	'bsveggensteinleopoldshafen',
	'bvgifhorn',
	'bvmaintal',
	'bvmuelheim',
	'bvrwwesel',
	'cfbkoeln',
	'djkteutsttnis',
	'dhfkleipzig', // png logo
	'ebtberlin',
	'esvnuernberg', // png logo
	'fclangenfeld',
	'friedrichsdorf', // png logo
	'gladbeckerfc',
	'hamburghornertv',
	'haunstetten', // png logo
	'harkenbleck',
	'hoevelhof',
	'sganspach',
	'sgebtberlin',
	'sgschorndorf',
	'stcblauweisssolingen',
	'sterkrade',
	'svberlinerbrauereien',
	'svfortunaregensburg',
	'svfischbach',
	'svfunballdortelweil',
	'svgutsmuthsjena',
	'tsvansbach', // png logo
	'tsvfreystadt',
	'tsvneubibergottobrunn',
	'tsvneuhausen',
	'tsvtrittau',
	'tusgeretsried',
	'tusschwanheim',
	'tusneuhofen',
	'tuswiebelskirchen',
	'tvdillingen',
	'tvemsdetten',
	'tvhofheim',
	'tvmarktheidenfeld',
	'tvrefrath',
	'tvwitzhelden',
	'unionluedinghausen',
	'vfbfriedrichshafen',
	'vfbgwmuelheim',
	'vfbscpeine',
	'wittorfneumuenster',
];
var LOGO_ALIASSE = {
	'1. BC Sbr.-Bischmisheim': 'bcbsaarbruecken',
	'1.BC Sbr.-Bischmisheim': 'bcbsaarbruecken',
	'1.BV Mülheim': 'bvmuelheim',
	'1. BV Mülheim': 'bvmuelheim',
	'1.CfB Köln': 'cfbkoeln',
	'1. CfB Köln': 'cfbkoeln',
	'BC Bischmisheim': 'bcbsaarbruecken',
	'BC Phönix Hövelhof': 'hoevelhof',
	'Blau-Weiss Wittorf-NMS': 'wittorfneumuenster',
	'Blau-Weiss Wittorf NMS': 'wittorfneumuenster',
	'Blau-Weiss Wittorf': 'wittorfneumuenster',
	'ESV Flügelrad Nürnberg': 'esvnuernberg',
	'Horner TV': 'hamburghornertv',
	'HSG DHfK Leipzig': 'dhfkleipzig',
	'SC Union 08 Lüdinghausen': 'unionluedinghausen',
	'SC Union Lüdinghausen': 'unionluedinghausen',
	'SG VfB/SC Peine': 'vfbscpeine',
	'Spvgg.Sterkrade-N.': 'sterkrade',
	'Spvgg Sterkrade-Nord': 'sterkrade',
	'STC BW Solingen': 'stcblauweisssolingen',
	'SV Harkenbleck': 'harkenbleck',
	'TSV Neuhausen-Nymphenburg': 'tsvneuhausen',
	'TSV Neuhausen-Nymphenburg München': 'tsvneuhausen',
	'TuS Friedrichsdorf': 'friedrichsdorf',
	'Union Lüdinghausen': 'unionluedinghausen',
	'VfB GW Mülheim': 'vfbgwmuelheim',
};
function team_logo(team_name, warn=true) {
	team_name = LOGO_ALIASSE[team2club(team_name)] || team_name;

	var clean_name = team_name.toLowerCase().replace(/[^a-z]/g, '');
	if (LOGOS.includes(clean_name)) {
		return 'logos/' + clean_name + '.svg';
	} else {
		if (warn) {
			report_problem.silent_error(
				`Cannot find logo for "${team_name}" (looked at ${JSON.stringify(clean_name)})`);
		}
	}
}

function team2club(team_name) {
	return team_name.replace(/[\s0-9]+$/, '');
}

var NRW2016_RE = /^NRW-(O19)-(?:(?:GW|([NS])([12]))-)?([A-Z]{2})-([0-9]{3})-(?:2016|2017)$/;
function name_by_league(league_key) {
	if (/^1BL-(?:20[0-9]{2})$/.test(league_key)) {
		return '1. Bundesliga';
	}
	if (/^2BLN-(?:20[0-9]{2})$/.test(league_key)) {
		return '2. Bundesliga Nord';
	}
	if (/^2BLS-(?:20[0-9]{2})$/.test(league_key)) {
		return '2. Bundesliga Süd';
	}
	if (league_key === 'OBL-2017') {
		return 'ÖBV-Bundesliga'; // Österreich
	}
	if (league_key === 'RLN-2016') {
		return 'Regionalliga Nord';
	}
	if (league_key === 'RLM-2016') {
		return 'Regionalliga Mitte';
	}
	if (league_key === 'NLA-2017') {
		return 'NLA';
	}
	if (league_key === 'RLW-2016') {
		return 'Regionalliga West';
	}
	if (league_key === 'RLSO-2019') {
		return 'Regionalliga SüdOst';
	}

	var m = NRW2016_RE.exec(league_key);
	if (m) {
		var league_name = {
			'RL': 'Regionalliga',
			'OL': 'NRW-Oberliga',
			'VL': 'Verbandsliga',
			'LL': 'Landesliga',
			'BL': 'Bezirksliga',
			'BK': 'Bezirksklasse',
			'KL': 'Kreisliga',
			'KK': 'Kreisklasse',
		}[m[4]];

		var location_name;
		if (m[4] === 'RL') {
			location_name = 'West';
		} else if (m[4] === 'OL') {
			location_name = (m[5] === '002') ? 'Nord' : 'Süd';
		} else {
			location_name = {
				'N': 'Nord',
				'S': 'Süd',
			}[m[2]];
			if (location_name) {
				location_name += ' ' + m[3];
			} else {
				location_name = m[2] + ' ' + m[3];
			}
		}

		if (!league_name) {
			return league_key;
		}

		return league_name + ' ' + location_name + ' (' + m[5] + ')';
	}

	return league_key;
}

var SHORT_NAMES = {
	'TSV Neuhausen-Nymphenburg': 'Neuhausen',
	'Hamburg Horner TV': 'HornerTV',
	'Horner TV': 'HornerTV',
	'SV GutsMuths Jena': 'Jena',
	'Spvgg.Sterkrade-N.': 'Sterkrade',
	'ESV Flügelrad Nürnberg': 'Nürnberg',
	'SV Berliner Brauereien': 'BerlinerBrauereien',
	'1.BV Mülheim': 'BVMülheim',
	'VfB GW Mülheim': 'GWMülheim',
	'Gladbecker FC': 'Gladbeck',
	'1.CfB Köln': 'Köln',
};
function shortname(team_name) {
	var num_m = /^(.*)\s([JSM]?(?:[1-9]|[1-3][0-9]))$/.exec(team_name);
	var core_name = num_m ? num_m[1] : team_name;
	if (SHORT_NAMES[core_name]) {
		return SHORT_NAMES[core_name] + (num_m ? num_m[2] : '');
	}
	var parts = core_name.split(/[\s-/]+/);
	var res = parts[0];
	parts.forEach(function(p) {
		if (p.length > res.length) {
			res = p;
		}
	});
	if (num_m) {
		res += num_m[2];
	}
	return res;
}

return {
	shortname: shortname,
	get_color: get_color,
	team_logo: team_logo,
	name_by_league: name_by_league,
};

})();


/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	module.exports = extradata;

	var report_problem = require('./report_problem');
}
/*/@DEV*/
