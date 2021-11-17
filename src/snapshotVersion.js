const program = require('commander');
const createVersion = require('./lib/createVersion.js');

module.exports = (argsParser = process.argv) => {
    program
        .command('create')
        .storeOptionsAsProperties(true)
        .requiredOption('--version <type>', 'The value of the new version to create.')
        .option('--siteDir <type>', 'The absolute or relative path to the `website` directory of the Docusaurus V1 project.', '.')
        .option('--staticDir <type...>', 'The file type of the static file type to be versioned.')
        .action((options) => {
            let version = options.version;
            let siteDir = options.siteDir;
            let staticDir = options.staticDir;
            if (!staticDir) {
                staticDir = [];
            }
            createVersion.create(version, siteDir, staticDir);
        });
    program.parse(argsParser);
}