#!/usr/bin/env node

const {bupdate} = require('./src/bup_handlers');

let done = false;
process.on('exit', code => {
	if (code === 0 && !done) {
		console.error('bupdate exited without finishing (a promise never settled)');
		process.exitCode = 3;
	}
});

(async () => {
	try {
		const newVersion = await bupdate();
		console.log(`Updated to bup ${newVersion}`);
		done = true;
	} catch (e) {
		console.error(e.stack);
		process.exit(2);
	}
})();
