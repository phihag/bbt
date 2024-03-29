'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const {StringDecoder} = require('string_decoder');
const xmldom = require('xmldom');

const {deep_equal} = require('../static/cutils');

function broadcast(wss, msg) {
	const json_msg = JSON.stringify(msg);

	for (const client of wss.clients) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(json_msg, (err) => {
				if (err) {
					console.error('Error while broadcasting to wsclient: ' + err.stack); // eslint-disable-line no-console
				}
			});
		}
	}
}

function send(ws, obj) {
	assert(typeof obj === 'object');
	ws.send(JSON.stringify(obj), (err) => {
		if (err) {
			console.error('Error while sending to wsclient: ' + err.stack); // eslint-disable-line no-console
		}
	});
}

/*
func gets called with (err, next_interval).
Both arguments must always be present.
*/
function run_every(func) {
	function cb(err, next_interval) {
		if (err === 'aborted') return;

		if (err) {
			console.error('Error during run: ' + err.stack); // eslint-disable-line no-console
		}
		setTimeout(() => run_every(func), next_interval);
	}

	try {
		func(cb);
	} catch(e) {
		console.error('Uncaught error: ' + e.stack + '. Retrying in 10s.'); // eslint-disable-line no-console
		setTimeout(() => run_every(func), 10000);
	}
}

// Callback gets called with (error, response, body as string)
function download_page(url, cb) {
	const http_mod = url.startsWith('https') ? https : http;
	http_mod.get(url, (res) => {
		const chunks = [];

		res.on('data', (chunk) => {
			chunks.push(chunk);
		});
		res.on('end', () => {
			const buf = Buffer.concat(chunks);

			let guess_encoding;
			if (res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
				const first_bytes = buf.slice(0, 1024);
				const ascii_sd = new StringDecoder('ascii');
				const html_head = ascii_sd.write(first_bytes);
				const m = /(?:<meta\s+charset="|<meta\s+http-equiv="Content-Type"\s*content="[^;]*;\s+charset=)([^"]+)"/i.exec(html_head);
				if (m) {
					guess_encoding = {
						'iso-8859-1': 'latin1',
						'iso-8859-15': 'latin1',
					}[m[1].toLowerCase()];
				}
			}
			const encoding = guess_encoding || 'utf8';

			const sd = new StringDecoder(encoding);
			const body = sd.write(buf);

			cb(null, res, body);
		});
	}).on('error', (e) => {
		cb(e, null, null);
	});
}

function find(ar, cb) {
	for (var i = 0;i < ar.length;i++) {
		if (cb(ar[i])) {
			return ar[i];
		}
	}
	return null;
}

function parse_querystring(url) {
	// Adapted from https://stackoverflow.com/a/3855394/35070

	const query_m = /^[^?]+\?([^#]*)(?:#.*)?$/.exec(url);
	if (! query_m) {
		return {};
	}
	const query = query_m[1];

	return query.split('&').reduce((res, param) => {
		const [key, value] = param.split('=');
		res[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
		return res;
	}, {});
}

function deep_copy(obj) {
	if (obj === undefined) {
		return obj;
	}
	return JSON.parse(JSON.stringify(obj));
}

function read_json(fn, callback) {
	fs.readFile(fn, (err, json) => {
		if (err) return callback(err);
		return callback(null, JSON.parse(json));
	});
}

async function read_json_async(fn) {
	const json = await fs.promises.readFile(fn);
	return JSON.parse(json);
}

function pad(n, width, z) {
	z = z || '0';
	width = width || 2;
	n = n + '';
	return n.length >= width ? n : (new Array(width - n.length + 1).join(z) + n);
}

function obj_update(obj, other) {
	for (const key in other) {
		obj[key] = other[key];
	}
}

// Returns (error_message, doc)
function parseXML(str) {
	let error_msg;
	const eh = {
		error: (emsg => {
			if (error_msg) {
				return; // Not the first error
			}
			error_msg = emsg;
		}),
		fatalError: (emsg => {
			if (error_msg) {
				return; // Not the first error
			}
			error_msg = emsg;
		}),
	};
	const parser = new xmldom.DOMParser({errorHandler: eh});
	const doc = parser.parseFromString(str, 'text/xml');
	if (error_msg) {
		return [error_msg, null];
	}
	return [null, doc];
}

function cmp(a, b) {
	if (a < b) {
		return -1;
	} else if (a > b) {
		return 1;
	} else {
		return 0;
	}
}

function cmp_key(key) {
	return function(x, y) {
		return cmp(x[key], y[key]);
	};
}

function ensure_mkdir(path, cb) {
	fs.mkdir(path, 0o755, function(err) {
		if (err && err.code == 'EEXIST') {
			return cb(null);
		}
		cb(err);
	});
}

function download_file(url, fn, callback) {
	const file = fs.createWriteStream(fn);
	https.get(url, response => {
		if (response.statusCode !== 200) {
			return callback(new Error(url + ' failed with code ' + response.statusCode));
		}
		response.pipe(file);
		file.on('finish', () => {
			file.close(callback);
		});
	}).on('error', (err) => {
		fs.unlink(fn);
		callback(err);
	});
}

function async_express_handler(func) {
	return async (req, res, next) => {
		try {
			await func(req, res);
		} catch(err) {
			return next(err);
		}
	};
}

module.exports = {
	async_express_handler,
	broadcast,
	cmp,
	cmp_key,
	deep_copy,
	deep_equal,
	download_page,
	download_file,
	ensure_mkdir,
	find,
	obj_update,
	pad,
	parse_querystring,
	parseXML,
	read_json,
	read_json_async,
	run_every,
	send,
};
