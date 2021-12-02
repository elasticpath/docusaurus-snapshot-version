const program = require('commander');
const createVersion = require('./lib/createVersion.js');

module.exports = (argsParser = process.argv) => {
    program
        .command('create')
        .requiredOption('--version <type>', '[required] The value of the new version to create.')
        .option('--siteDir <type>', '[optional] The absolute or relative path to the `website` directory of the Docusaurus V1 project.', '.')
        .option('--staticDir <type...>', '[optional] The name of the static asset directory to be versioned under the website/static directory', [])
        .action((options) => {
            createVersion.create(options.version, options.siteDir, options.staticDir);
        });
    program.parse(argsParser);
}
