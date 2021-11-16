const fs = require('fs').promises;
const path = require('path');
const parseArguments = require('minimist');

function main() {
    let args = parseArguments(process.argv.slice(2));
    let version = args['version'];
    let assetTypes = [].concat(args['assetType']);
    moveAssetFiles(version, assetTypes)
        .catch(err => console.log(err));
    updateVersionedDocsPaths(version, assetTypes)
        .catch(err => console.log(err));
}

async function moveAssetFiles(version, assetTypes) {
    let fileContent = await fs.readFile("versions.json", "utf8");
    let jsonContent = JSON.parse(fileContent);
    let objectSize =  jsonContent.length;
    let excludeFromRemoval = ["next"];

    for (const assetType of assetTypes) {
        if (objectSize === 1) {
            await copyDirectory(`static/${assetType}/`, `static/${assetType}/next`);
            await removeFilesInDirectory(`static/${assetType}/`, excludeFromRemoval);
        }
        await copyDirectory(`static/${assetType}/next`, `static/${assetType}/${version}`)
    }
}

async function copyDirectory(from, to) {
    await fs.mkdir(to);

    const files = await fs.readdir(from, {withFileTypes: true});
    for (const file of files) {
        let relativePath = path.join(from, file.name);
        let targetPath = path.join(to, file.name);
        if (file.isDirectory() && relativePath !== to) {
            await copyDirectory(relativePath, targetPath);
        } else if(!file.isDirectory()) {
            await fs.copyFile(relativePath, targetPath)
                .catch((err) => console.log(err + '\n' + `${relativePath} could not be copied`));
        }
    }
}

async function removeFilesInDirectory(from, exclude) {
    const files = await fs.readdir(from, {withFileTypes: true});
    for (const file of files) {
        if (!exclude.includes(file.name)) {
            await fs.rm(path.join(from, file.name), {recursive: true});
        }
    }
}

/*
  Recursive function to find all files in the current directory and
  replace the links in the file.
 */
async function updateVersionedDocsPaths(version, assetTypes, subDirName="") {
    let baseVersionedDocsPath = `versioned_docs/version-${version}`;
    // sub directory is appended to path to check for files
    let versionedDocsPath = path.join(baseVersionedDocsPath, subDirName);

    // read all files from directory
    const files = await fs.readdir(versionedDocsPath, {withFileTypes: true});
    for (const file of files) {
        // if file type is a directory, a recursive call is made
        if (file.isDirectory()) {
            let subDirName = file.name;
            await updateVersionedDocsPaths(version, assetTypes, subDirName);
        } else {
            let filePath = path.join(versionedDocsPath, file.name);
            await replaceRelativePaths(filePath, assetTypes, version);
        }
    }
}

async function replaceRelativePaths(filePath, assetTypes, version) {
    let fileContent = await fs.readFile(filePath, {encoding: "utf8", flag: "r+"});
    // flag to check if files have been modified
    let isFileContentModified = false;

    // loop through all the asset types passed in by users and replace the text
    for (const assetType of assetTypes) {
        let relative_link_pattern = new RegExp(`../${assetType}/next`, 'gm');
        let textToReplace = `${assetType}/${version}`;
        fileContent = fileContent.replace(relative_link_pattern, function() {
            isFileContentModified = true;
            return textToReplace;
        });
    }

    // write to file if contents have been modified
    if (isFileContentModified) {
        console.log(`Updating markdown files..`)
        await fs.writeFile(filePath, fileContent);
    }
}

module.exports.main = main();
