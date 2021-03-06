/*eslint no-console: "off"*/

const fs = require('fs');
const path = require('path');

const {readConfig, parseArgs} = require('./config');
const {localIso8601} = require('./utils');
const runner = require('./runner');
const render = require('./render');
const {color, logVerbose} = require('./output');
const {testsVersion, pentfVersion} = require('./version');
const {loadTests} = require('./loader');
const watcher = require('./watcher');

/**
 * @param {import('./config').Config} config
 * @param {import('./runner').TestCase[]} test_cases
 */
async function runTests(config, test_cases) {
    let results;
    if (config.load_json) {
        const json_input = await fs.promises.readFile(config.load_json, {encoding: 'utf-8'});
        results = JSON.parse(json_input);
    } else {
        if (config.log_file && !config.log_file_stream) {
            const stream = fs.createWriteStream(config.log_file, { flags: 'w' });
            const time = localIso8601();
            stream.write(`${time} Start runner\n`);
            config.log_file_stream = stream;
        }

        // Run tests
        const test_info = await runner.run(config, test_cases);
        if (!test_info) {
            logVerbose(config, '[runner] No run information returned by runner');
            return;
        }

        results = render.craftResults(config, test_info);
    }

    await render.doRender(config, results);
    return results;
}

/**
 * @typedef {Object} PentfOptions
 * @property {(config: import('./config').Config) => import('./config').Config} [defaultConfig]
 * Function to call on the loaded configuration, to set/compute default values.
 * @property {string} [description] program description in the --help output
 * @property {string} [rootDir] Root directory (assume tests/ contains tests,
 * config/ if exists contains config)
 * @property {string} [configDir] Configuration directory. false disables
 * configuration.
 */

/**
 * @param {PentfOptions} options
 */
async function real_main(options={}) {
    if (options.rootDir) {
        if (! options.configDir) {
            const autoConfigDir = path.join(options.rootDir, 'config');
            if (fs.existsSync(autoConfigDir)) {
                options.configDir = autoConfigDir;
            }
        }
    }

    const args = parseArgs(options, process.argv.slice(2));
    const config = await readConfig(options, args);

    if (options.defaultConfig) {
        options.defaultConfig(config);
    }

    if (!config.colors) {
        // Trick other libraries (e.g. node's assert.strict) into not using colors
        process.env.NODE_DISABLE_COLORS = 'true';
    }

    const test_cases = await loadTests(config, config.testsGlob);

    if (args.print_version) {
        console.log(await testsVersion(config));
        console.log('pentf ' + pentfVersion());
        return;
    }

    // Argparse wraps argument lists with another array
    if (config.extensions.length) {
        config.extensions = config.extensions
            .reduce((acc, item) => acc.concat(item), []);
    }

    if (args.list) {
        for (const tc of test_cases) {
            let description = '';
            if (tc.description) {
                description = (
                    ' ' + (config.colors ? '' : '(') +
                    color(config, 'dim', tc.description) +
                    (config.colors ? '' : ')')
                );
            }

            console.log(color(config, 'white', tc.name) + description);
        }
        return;
    }

    if (args.print_config) {
        console.log(config);
        return;
    }

    if (config.watch) {
        await watcher.createWatcher(config, async test_cases => {
            await runTests(config, test_cases);
        });
    } else {
        const results = await runTests(config, test_cases);

        if (!config.keep_open) {
            const anyErrors = results.tests.some(s => s.status === 'error' && !s.expectedToFail);
            const retCode = (!anyErrors || config.exit_zero) ? 0 : 3;
            logVerbose(`Terminating with exit code ${retCode}`);
            process.exit(retCode);
        }
    }
}

function main(options) {
    (async () => {
        try {
            await real_main(options);
        } catch (e) {
            console.error(e.stack);
            process.exit(2);
        }
    })();
}

module.exports = {
    main,
};
