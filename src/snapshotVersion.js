const program = require('commander');
const createVersion = require('./lib/createVersion.js');

module.exports = (argsParser = process.argv) => {
    program
        .command('create')
        .requiredOption('--version <type>', '[required] The value of the new version to create.')
        .option('--siteDir <type>', '[optional] The absolute or relative path to the `website` directory of the Docusaurus V1 project.', '.')
        .option('--staticDir <type...>', '[optional] The name of the static asset directory to be versioned from the static directory in the docs repository', [])
        .action((options) => {
            let version = options.version;
            let siteDir = options.siteDir;
            let staticDir = options.staticDir;
            createVersion.create(version, siteDir, staticDir);
        });
    program.parse(argsParser);
}
