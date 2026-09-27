const async = require('async');
const express = require('express');
const http = require('http');

const ws_module = require('ws');

const changedate = require('./changedate');
const config = require('./config');
const sources = require('./sources');
const routes = require('./routes');
const utils = require('./utils');


function setup_ws(app, ws, req) {
	const location = new URL(req.url, 'http://localhost');

	if (! location.pathname.endsWith('/subscribe')) {
		utils.send(ws, {
			type: 'error',
			message: 'Invalid location path ' + location.pathname,
		});
		ws.close();
		return;
	}
	ws.onmessage = (e) => {
		let msg;
		try {
			msg = JSON.parse(e.data);
		} catch (e) {
			console.error('Client did not send us valid JSON, terminating: ' + e.stack); // eslint-disable-line no-console
			ws.close();
			return;
		}

		if (msg.type === 'keepalive') {
			try {
				ws.send(JSON.stringify({
					type: 'keptalive',
				}));
			} catch (_) {
				// Ignore
			}
		}
	};

	const events = app.state_handlers.map(sh => sh.ev);
	utils.send(ws, {
		type: 'init',
		events: events,
	});
}


function run_server(cfg, source_info) {
	const server = http.createServer();
	const wss = new ws_module.Server({server});
	const app = express();

	app.cfg = cfg;
	app.root_path = cfg('root_path');
	app.source_info = source_info;

	// Set up state handlers
	changedate.setup(app, wss, source_info);

	wss.on('connection', (ws, req) => setup_ws(app, ws, req));

	routes.setup(cfg, app);

	server.on('request', app);
	server.listen(cfg('port'), () => {});
}

function main() {
	async.waterfall([
		config.load,
		(cfg, cb) => {
			if (cfg('disable_tls_verification', false)) {
				process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
			}
			cb(null, cfg);
		},
		(cfg, cb) => sources.load((err, source_info) => cb(err, cfg, source_info)),
	], (err, cfg, source_info) => {
		if (err) {
			throw err;
		}
		run_server(cfg, source_info);
	});
}

main();
