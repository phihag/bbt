'use strict';

const child_process = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');
const {promisify} = require('util');

async function sha512_file(fn) {
	return new Promise((resolve, reject) => {
		const sha_sum = crypto.createHash('SHA512');

		const s = fs.ReadStream(fn);
		s.on('data', function(d) {
			sha_sum.update(d);
		});
		s.on('error', function(err) {
			reject(err);
		});
		s.on('end', function() {
			resolve(sha_sum.digest('hex'));
		});
	});
}

async function exists(path) {
	try {
		await promisify(fs.stat)(path);
	} catch (err) {
		if (err.code === 'ENOENT') {
			return false;
		}
		throw err;
	}

	return true;
}

async function rename(oldPath, newPath) {
	try {
		await promisify(fs.rename)(oldPath, newPath);
	} catch(err) {
		if (err.code === 'EXDEV') {
			// On AUFS (e.g. docker), rename is not supported:
			// https://docs.docker.com/engine/userguide/storagedriver/aufs-driver/#modifying-files-or-directories
			// Fall back to mv instead.
			await new Promise((resolve, reject) => {
				child_process.execFile('mv', ['-T', '--', oldPath, newPath], (err, _stdout, stderr) => {
					if (err) {
						return reject(new Error(
							'mv -T -- ' + JSON.stringify(oldPath) + ' ' + JSON.stringify(newPath) + ' failed: ' + stderr));
					}

					resolve();
				});
			});
		} else {
			throw err;
		}
	}
}


// Extract all files of a zip file into dir (which is created if necessary).
// Rejects on any error, including entries that would end up outside of dir.
async function extract_zip(zip_fn, dir) {
	const root = path.resolve(dir);
	await promisify(fs.mkdir)(root, {recursive: true});
	const zipfile = await promisify(yauzl.open)(zip_fn, {lazyEntries: true});
	const open_stream = promisify(zipfile.openReadStream.bind(zipfile));

	try {
		await new Promise((resolve, reject) => {
			zipfile.on('error', reject);
			zipfile.on('end', resolve);
			zipfile.on('entry', async entry => {
				try {
					const dest = path.resolve(root, entry.fileName);
					if (dest !== root && !dest.startsWith(root + path.sep)) {
						throw new Error(`Refusing to extract ${JSON.stringify(entry.fileName)}: outside of ${root}`);
					}

					if (/\/$/.test(entry.fileName)) {
						await promisify(fs.mkdir)(dest, {recursive: true});
					} else {
						await promisify(fs.mkdir)(path.dirname(dest), {recursive: true});
						const read_stream = await open_stream(entry);
						await new Promise((res, rej) => {
							const write_stream = fs.createWriteStream(dest);
							read_stream.on('error', rej);
							write_stream.on('error', rej);
							write_stream.on('finish', res);
							read_stream.pipe(write_stream);
						});
					}
					zipfile.readEntry();
				} catch (err) {
					reject(err);
				}
			});
			zipfile.readEntry();
		});
	} finally {
		zipfile.close();
	}
}

module.exports = {
	extract_zip,
	sha512_file,
	exists,
	rename,
};
