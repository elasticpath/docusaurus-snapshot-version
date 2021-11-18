const fs = require('fs').promises;
const path = require('path');

async function versionStaticAssets(staticDir, staticAssets, version) {
    let numberOfVersions = await getNumberOfVersions();
    let excludeFromRemoval = ["next"];

    for (const staticType of staticAssets) {
        console.info("Versioning static asset files...");
        let staticTypePath = path.join(staticDir, staticType);
        let staticTypeNextPath = path.join(staticTypePath, "next");
        if (numberOfVersions === 1) {
            await copyDirectory(staticTypePath, staticTypeNextPath);
            await removeFilesInDirectory(staticTypePath, excludeFromRemoval);
        }
        let staticTypeVersionPath = path.join(staticTypePath, version);
        await copyDirectory(staticTypeNextPath, staticTypeVersionPath)
    }
}

async function getNumberOfVersions() {
    let fileContent = await fs.readFile("versions.json", "utf8");
    let jsonContent = JSON.parse(fileContent);
    return jsonContent.length;
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

module.exports.versionStaticAssets = versionStaticAssets;
module.exports.updateVersionedDocsPaths = updateVersionedDocsPaths;
