const fs = require('fs').promises;
const path = require('path');

async function versionStaticAssets(staticDir, staticAssets, version) {
    let numberOfVersions = await getNumberOfVersions();
    let excludeFromRemoval = ["next"];

    for (const staticType of staticAssets) {
        console.info("Versioning static asset files...");
        if (numberOfVersions === 1) {
            await copyDirectory(`static/${staticType}/`, `static/${staticType}/next`);
            await removeFilesInDirectory(`static/${staticType}/`, excludeFromRemoval);
        }
        await copyDirectory(`static/${staticType}/next`, `static/${staticType}/${version}`)
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
                .then(() => console.log(targetPath))
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
async function updateVersionedDocsPaths(baseVersionedDocsPath, staticAssets, version) {
    let numberOfVersions = await getNumberOfVersions();
    baseVersionedDocsPath = path.join(baseVersionedDocsPath, `version-${version}`);
    await findFilesToUpdate(baseVersionedDocsPath, staticAssets, version);

    if (numberOfVersions === 1) {
        baseVersionedDocsPath = "../docs";
        await findFilesToUpdate(baseVersionedDocsPath, staticAssets);
        // want to update path in docs directory first
    }
}

async function findFilesToUpdate(basePath, staticAssets, version="", subDirName="") {
    // sub directory is appended to path to check for files
    let versionedDocsPath = path.join(basePath, subDirName);

    // read all files from directory
    const files = await fs.readdir(versionedDocsPath, {withFileTypes: true});
    for (const file of files) {
        // if file type is a directory, a recursive call is made
        if (file.isDirectory()) {
            let subDirName = file.name;
            await findFilesToUpdate(versionedDocsPath, staticAssets, version, subDirName);
        } else {
            let filePath = path.join(versionedDocsPath, file.name);
            await replaceRelativePaths(filePath, staticAssets, version);
        }
    }
}

async function replaceRelativePaths(filePath, staticAssets, version) {
    let fileContent = await fs.readFile(filePath, {encoding: "utf8", flag: "r+"});
    // flag to check if files have been modified
    let isFileContentModified = false;

    // loop through all the asset types passed in by users and replace the text
    for (const staticType of staticAssets) {

        let relativeLinkPattern = new RegExp(`../${staticType}/next`, 'gm');
        let textToReplace = `${staticType}/${version}`;
        if (!version) {
            relativeLinkPattern = new RegExp(`../${staticType}/`, 'gm')
            textToReplace = `../../${staticType}/next/`;
        }
        fileContent = fileContent.replace(relativeLinkPattern, function() {
            console.info(`replacing paths in ${filePath}...`)
            isFileContentModified = true;
            return textToReplace;
        });
    }

    // write to file if contents have been modified
    if (isFileContentModified) {
        await fs.writeFile(filePath, fileContent);
    }
}

module.exports.versionStaticAssets = versionStaticAssets;
module.exports.updateVersionedDocsPaths = updateVersionedDocsPaths;
