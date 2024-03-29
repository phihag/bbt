'use strict';

function copy_props(ev, src) {
	for (const k of ['starttime', 'date', 'ts', 'admin_note', 'admin_note_html', 'event_note', 'event_note_html', 'league_key', 'team_names', 'url', 'live_streams']) {
		if (Object.prototype.hasOwnProperty.call(src, k) && (ev[k] === undefined)) {
			ev[k] = src[k];
		}
	}
	ev.team_competition = true;

	if (!ev.team_names[1]) {
		const admin_note = (
			'Der Original-Liveticker ist noch nicht verfügbar.'
		);
		ev.admin_note = ev.admin_note || admin_note;
		ev.team_names = src.team_names;
		ev.matches = false;
		ev.mscore = [0, 0];
		ev.link = ev.link || src.link || src.url;
	} else if (ev.team_names[1] !== src.team_names[1]) {
		const admin_note = (
			'Der Original-Liveticker ist noch nicht richtig eingestellt' +
			'\n(zeigt noch ' + ev.team_names[0] + ' - ' + ev.team_names[1] + ').'
		);
		ev.admin_note = ev.admin_note || admin_note;
		ev.team_names = src.team_names;
		ev.matches = false;
		ev.mscore = [0, 0];
		ev.link = ev.link || src.link || src.url;
	}
}


module.exports = {
	copy_props,
};