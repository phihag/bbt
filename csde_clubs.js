#!/usr/bin/env node

const assert = require('assert');
const argparse = require('argparse');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const utils = require('./src/utils');
const {unify_team_name} = require('./src/eventutils.js');

const TARGET_FILE = path.join(__dirname, 'src', 'csde_map.js');


async function main() {
	const parser = new argparse.ArgumentParser({
		description: 'Generate and write club IDs for CourtSpot',
	});
	parser.addArgument('--display', {action: 'storeTrue', help: `Do not write to ${TARGET_FILE}, display instead`});
	const args = parser.parseArgs();

	const lines = [];
	for (const league of [1, 2, 3, 4, 5, 6, 7, /*11, 12, */14]) {
		const response = await fetch(`https://courtspot.de/php__Skripte/getVereine.php?liga=${league}`);
		assert.equal(response.status, 200);
		const xml = await response.text();

		const [err_msg, doc] = utils.parseXML(xml);
		assert(!err_msg, `Failed to parse XML: ${err_msg}`);
		for (const el of Array.from(doc.getElementsByTagName('Verein'))) {
			let name = el.getElementsByTagName('Lang')[0].textContent;
			const name_m = /^(.*)\ 1$/.exec(name);
			if (name_m) {
				name = name_m[1];
			}
			name = unify_team_name(name);

			const id = el.getElementsByTagName('Nummer')[0].textContent;
			lines.push(`    '${league}-${id}': '${name}',`);
		}
	}

	if (args.display) {
		for (const line of lines) {
			console.log(line.trim());
		}
	} else {
		const js = (
			"'use strict';\n\n" +
			'const TEAM_NAMES = {\n' +
			lines.join('\n') +
			'\n};\n\n' +
			'module.exports = {\n' + 
			'    TEAM_NAMES,\n' +
			'};\n'
		);
		await fs.promises.writeFile(TARGET_FILE, js, {encoding: 'utf-8'});
		console.log(`Updated ${TARGET_FILE}`);
	}
}


(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e.stack);
        process.exit(2);
    }
})();
