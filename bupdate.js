#!/usr/bin/env node

const {bupdate} = require('./src/bup_handlers');

(async () => {
	try {
		const newVersion = await bupdate();
		console.log(`Updated to bup ${newVersion}`);
	} catch (e) {
		console.error(e.stack);
		process.exit(2);
	}
})();
