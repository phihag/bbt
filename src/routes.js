'use strict';

const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');

const web_handlers = require('./web_handlers');
const bup_handlers = require('./bup_handlers');
const admin_handlers = require('./admin_handlers');

async function setup(cfg, app) {
	app.use('/static', express.static((cfg('production', false) ? 'dist/' : '') + 'static'));
	app.use(favicon(path.dirname(__dirname) + '/static/favicon.ico'));

	app.get('/', web_handlers.root_handler);
	app.get('/api/state', web_handlers.api_handler);
	app.get('/events.json', web_handlers.json_handler);
	app.get('/embed.js', web_handlers.embed_handler);
	app.get('/allteams', web_handlers.allteams_handler);
	app.get('/streams', web_handlers.streams_handler);
	app.get('/s/:shortname', web_handlers.stream_handler);
	app.get('/s/:shortname/team', web_handlers.streamteam_handler);
	app.get('/s/:shortname/:court', web_handlers.streamcourt_handler);

	app.get('/bupdate', bup_handlers.bupdate_handler);
	app.use('/bup', express.static('bup', {index: ['index.html', 'bup.html']}));
	app.get('/event', bup_handlers.event_handler);

	await admin_handlers.setup(cfg, app);
}


module.exports = {
	setup: setup,
};
