const assert = require('assert').strict;
const path = require('path');
const child_process = require('child_process');

async function run() {
    // Run in subprocess so that handle exhaustion does not affect this process
    const sub_run = path.join(__dirname, 'suite', 'run');
    const {stderr} = await new Promise((resolve, reject) => {
        child_process.execFile(
            sub_run,
            ['--exit-zero', '--no-screenshots', '-f', '^only'],
            { cwd: path.dirname(sub_run) },
            (err, stdout, stderr) => {
                if (err) reject(err);
                else resolve({stdout, stderr});
            }
        );
    });

    assert(/1 tests passed/.test(stderr), 'Only runs 1 test');
}

module.exports = {
    description: 'Load multiple tests from the same file',
    run,
};
