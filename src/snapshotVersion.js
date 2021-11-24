const program = require('commander');
const createVersion = require('./lib/createVersion.js');
const fs = require("fs");

module.exports = (argsParser = process.argv) => {
    program
        .command('create')
        .storeOptionsAsProperties(true)
        .requiredOption('--version <type>', '[required] The value of the new version to create.')
        .option('--siteDir <type>', '[optional] The absolute or relative path to the `website` directory of the Docusaurus V1 project.', '.')
        .option('--staticDir <type...>', '[optional] The static asset directory to be versioned. Only the name of the folder is required.')
        .action((options) => {
            let version = options.version;
            let siteDir = options.siteDir;
            let staticDir = options.staticDir;
            if (version.includes('/')) {
                throw new TypeError("Invalid version format. (/) character is not allowed in version");
            }
            if (!staticDir) {
                staticDir = [];
            }
            createVersion.create(version, siteDir, staticDir);
        });
    program.parse(argsParser);
}
