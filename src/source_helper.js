'use strict';

function copy_props(ev, src) {
	for (const k of ['starttime', 'admin_note', 'league_key']) {
		if (src.hasOwnProperty(k) && (ev[k] === undefined)) {
			ev[k] = src[k];
		}
	}
}


module.exports = {
	copy_props,
};