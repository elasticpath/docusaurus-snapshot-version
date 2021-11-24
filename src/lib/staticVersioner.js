const fs = require('fs').promises;
const path = require('path');

async function versionStaticAssets(sitePaths, staticAssets, version) {
    let numberOfVersions = await getNumberOfVersions();
    let staticDir = sitePaths.staticFolder;
    let versionDocsDir = sitePaths.versionedDocs;
    let excludeFromRemoval = ["next"];

    for (const staticType of staticAssets) {
        console.info("Versioning static asset files...");
        let staticTypePath = path.join(staticDir, staticType);
        let staticTypeNextPath = path.join(staticTypePath, "next");
        // if a static asset is versioned for the first time, create the next directory
        await fs.access(staticTypeNextPath)
            .catch(async () => {
                await copyDirectory(staticTypePath, staticTypeNextPath);
                await removeFilesInDirectory(staticTypePath, excludeFromRemoval);
            })
        let staticTypeVersionPath = path.join(staticTypePath, version);
        await copyDirectory(staticTypeNextPath, staticTypeVersionPath)
    }

    let baseVersionedDocsPath = path.join(versionDocsDir, `version-${version}`);
    if (numberOfVersions === 1) {
        await updateRelativePaths(sitePaths.docs, staticAssets);
    }
    await updateRelativePaths(baseVersionedDocsPath, staticAssets, version);
}

async function getNumberOfVersions() {
    let fileContent = await fs.readFile("./versions.json", "utf8");
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
  Recursive function that loops through all files in the current directory and
  subdirectories, and replaces the links in each file.
 */
async function updateRelativePaths(basePath, staticAssets, version="") {
    // read all files from directory
    const files = await fs.readdir(basePath, {withFileTypes: true});
    for (const file of files) {
        // if file type is a directory, a recursive call is made
        if (file.isDirectory()) {
            let subDirName = file.name;
            await updateRelativePaths(path.join(basePath, subDirName), staticAssets, version);
        } else {
            let filePath = path.join(basePath, file.name);
            await replaceRelativePaths(filePath, staticAssets, version);
        }
    }
}

async function replaceRelativePaths(filePath, staticAssets, version="") {
    let fileContent = await fs.readFile(filePath, {encoding: "utf8", flag: "r+"});
    // flag to set when files are modified
    let isFileContentModified = false;
    let numberOfVersions = await getNumberOfVersions();

    // loop through all the passed in static assets and replace the text
    for (const staticType of staticAssets) {

        let relativeLinkPattern = new RegExp(`../${staticType}/next`, 'gm');
        let replacementText = `${staticType}/${version}`;

        // if versioning for the first time, replace the links in the docs path and versioned docs path accordingly
        if (numberOfVersions === 1 && filePath.includes('/docs/')) {
            relativeLinkPattern = new RegExp(`../${staticType}/`, 'gm')
            replacementText = `../../${staticType}/next/`;
        } else if (numberOfVersions === 1 && filePath.includes('/versioned_docs/')) {
            relativeLinkPattern = new RegExp(`../${staticType}/`, 'gm');
            replacementText = `../${staticType}/${version}/`;
        }

        fileContent = fileContent.replace(relativeLinkPattern, function() {
            isFileContentModified = true;
            return replacementText;
        });
    }

    // if contents have been modified then write to file
    if (isFileContentModified) {
        await fs.writeFile(filePath, fileContent);
    }
}

module.exports.versionStaticAssets = versionStaticAssets;