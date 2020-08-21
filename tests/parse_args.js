const assert = require('assert').strict;
const {parseArgs} = require('../src/config.ts');

async function run() {
    assert.equal(parseArgs({}, [ '--ci']).ci, true);
}

module.exports = {
    run,
    description: 'Test cli argument parsing',
};
