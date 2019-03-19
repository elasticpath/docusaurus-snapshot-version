const program = require('commander');
const createVersion = require('./lib/createVersion.js');

module.exports = (argsParser = process.argv) => {
    program
        .command('create <version> [siteDir]')
        .action((version, siteDir = ".") => {
            createVersion.create(version, siteDir);
        });
    program.parse(argsParser);
}