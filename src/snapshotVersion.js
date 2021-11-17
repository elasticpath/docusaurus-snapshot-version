const program = require('commander');
const createVersion = require('./lib/createVersion.js');

module.exports = (argsParser = process.argv) => {
    program
        .command('create')
        .storeOptionsAsProperties()
        .requiredOption('--version <type>', 'The value of the new version to create.')
        .option('--siteDir <type>', 'The absolute or relative path to the `website` directory of the Docusaurus V1 project.', '.')
        .option('--assetType <type...>', 'The file type of the static file type to be versioned.')
        .action((options) => {
            let version = options.version;
            let siteDir = options.siteDir;
            let assetType = options.assetType;
            if (!assetType) {
                assetType = [];
            }
            createVersion.create(version, siteDir, assetType);
        });
    program.parse(argsParser);
}