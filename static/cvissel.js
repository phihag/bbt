'use strict';
var cvissel = (function() {

var prefs = {};
var lkeys = [];

function init_ui() {
	clear_checkboxes();
	if (!localStorage) {
		return;
	}
	var new_prefs_json = localStorage.getItem('bbt_vissel_prefs');
	if (new_prefs_json) {
		prefs = JSON.parse(new_prefs_json);
		update();
	}
}

function update() {
	uiu.qsEach('.bbt_event,.bbt_shortcut', function(el) {
		uiu.setClass(el, 'bbt_invisible', !is_visible(el.getAttribute('data-league_key')));
	});
}

function save() {
	if (!localStorage) {
		return;
	}
	localStorage.setItem('bbt_vissel_prefs', JSON.stringify(prefs));
}

function clear_checkboxes() {
	lkeys = [];
	rerender();
}

function add_league(league_key) {
	if (!league_key) {
		return; // uninitialized event
	}

	if (lkeys.indexOf(league_key) >= 0) {
		return;
	}

	lkeys.push(league_key);
	lkeys.sort();
	rerender();
}

function is_visible(league_key) {
	return prefs[league_key] !== false;
}

function rerender() {
	var vissel_container = uiu.qs('.bbt_vissel');
	uiu.empty(vissel_container);
	lkeys.forEach(function(lk) {
		var lbl = uiu.el(vissel_container, 'label');
		var cb = uiu.el(lbl, 'input', {
			type: 'checkbox',
			name: lk,
		});
		if (is_visible(lk)) {
			cb.setAttribute('checked', 'checked');
		}
		cb.addEventListener('change', function() {
			prefs[cb.getAttribute('name')] = cb.checked;
			save();
			update();
		});
		uiu.el(lbl, 'span', {}, extradata.name_by_league(lk));
	});
}

return {
	init_ui: init_ui,
	clear_checkboxes: clear_checkboxes,
	add_league: add_league,
	is_visible: is_visible,
};

})();

/*@DEV*/
if ((typeof module !== 'undefined') && (typeof require !== 'undefined')) {
	var uiu = null;
	var extradata = null;
	module.exports = cvissel;
}
/*/@DEV*/
