'use strict';

const child_process = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
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


module.exports = {
	sha512_file,
	exists,
	rename,
};
