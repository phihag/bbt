'use strict';

const assert = require('assert');
const crypto = require('crypto');
const extract_zip = require('extract-zip');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {promisify} = require('util');

const extradata = require('../static/extradata');
const render = require('./render');
const utils = require('./utils');
const promise_utils = require('./promise_utils');

const ROOT_DIR = path.dirname(__dirname);
const TMP_ROOT = path.join(ROOT_DIR, 'tmp');
const FINAL_DIR = path.join(ROOT_DIR, 'bup');
const ZIP_URL = 'https://aufschlagwechsel.de/bup.zip';


async function safe_rimraf(path) {
	assert(path.includes('/tmp'));
	await promisify(rimraf)(path);
}

async function bupdate() {
	try {
		const cur = await promisify(fs.lstat)(FINAL_DIR);
		if (cur.isSymbolicLink()) {
			throw new Error(
				`Refusing to bupdate; ${FINAL_DIR} is a symbolic link.` +
				' Remove the symlink to allow bupdate');
		}
	} catch (e) {
		if (e.code !== 'ENOENT') throw e;
	}

	const git_dir = path.join(FINAL_DIR, '.git');
	if (await promise_utils.exists(git_dir)) {
		throw new Error(
			`Refusing to bupdate; ${git_dir} exists.` +
			' Remove it to allow bupdate.');
	}


	const tmp_token = process.pid + '_' + Date.now() + '_' + crypto.randomBytes(4).readUInt32LE(0);
	const tmp_dir = path.join(TMP_ROOT, 'bupdate_tmp_' + tmp_token);
	const new_dir = path.join(tmp_dir, 'new');
	const zip_fn = path.join(tmp_dir, 'bup.zip');
	const backup_dir = path.join(TMP_ROOT, 'bupdate_tmp_oldbup_' + tmp_token);

	await promisify(utils.ensure_mkdir)(TMP_ROOT);
	await promisify(utils.ensure_mkdir)(tmp_dir);

	await promisify(utils.download_file)(ZIP_URL, zip_fn);
	const new_dir_abs = path.resolve(new_dir);
	await extract_zip(zip_fn, {dir: new_dir_abs});
	const checksums_fn = path.join(new_dir, 'bup', 'checksums.json');
	const checksums_json = await promisify(fs.readFile)(checksums_fn, 'utf8');
	const checksums = JSON.parse(checksums_json);

	for (const [vfn, file_checksums] of Object.entries(checksums)) {
		const fn = path.join(new_dir, vfn);

		const sum = await promise_utils.sha512_file(fn);
		if (sum !== file_checksums.sha512) {
			const msg = (
				'Incorrect checksum of ' + fn + ': ' +
				'Expected ' + sum + ', but is ' + file_checksums.sha512
			);
			throw new Error(msg);
		}
	}
	if (await promise_utils.exists(FINAL_DIR)) {
		await promise_utils.rename(FINAL_DIR, backup_dir);
	}

	await promise_utils.rename(path.join(new_dir, 'bup'), FINAL_DIR);
	await safe_rimraf(backup_dir);
	
	await safe_rimraf(tmp_dir);

	const version = await promisify(fs.readFile)(path.join(FINAL_DIR, 'VERSION'), 'utf8');
	return version.trim();
}

async function bupdate_handler(req, res, next) {
	try {
		const bup_version = await bupdate();

		if (req.query.format === 'text') {
			res.setHeader('content-type', 'text/plain');
			res.send(`Updated to bup ${bup_version}\n`);
			return;
		}

		render(req, res, next, 'bupdate_success', {
			bup_version,
		});
	} catch(err) {
		console.error('bupdate failed', err.stack); // eslint-disable-line no-console
		return next(err);
	}
}

function event_handler(req, res, next) {
	const events = req.app.state_handlers.map(sh => sh.ev);
	let team = req.query.team;
	if (!team) {
		return next(new Error('Missing GET parameter team'));
	}

	team = team.toLowerCase();
	const _matches = team_name => extradata.shortname(team_name).toLowerCase() === team;

	let data = undefined;
	// Home match?
	for (const ev of events) {
		if (!ev.team_names) continue;
		if (_matches(ev.team_names[0])) {
			data = ev;
			break;
		}
	}

	// Away match
	if (!data) {
		for (const ev of events) {
			if (!ev.team_names) continue;
			if (_matches(ev.team_names[1])) {
				data = ev;
				break;
			}
		}
	}
	if (!data) {
		res.status(404);
		res.setHeader('Content-Type', 'text/plain');
		res.send(`Event ${JSON.stringify(team)} not found`);
		return;
	}

	// Set empty courts to avoid errors
	if (!data.courts) {
		data = {...data};
		data.courts = [
			{'label': '1'},
			{'label': '2'},
		];
	}

	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.send(JSON.stringify(data, null, 2));
}

module.exports = {
	bupdate,
	bupdate_handler,
	event_handler,
};
