const fs = require('fs').promises;
const path = require('path');

async function versionStaticAssets(sitePaths, staticAssets, version) {
    console.log(sitePaths.staticDir);
    let staticDir = sitePaths.staticDir;
    let versionDocsDir = sitePaths.versionedDocs;

    for (const staticType of staticAssets) {
        console.info("Versioning static asset files...");
        let staticTypePath = path.join(staticDir, staticType);
        let staticTypeNextPath = path.join(staticTypePath, "next");

        /*
            If the next directory does not exist for a static asset type, then it is the first time it is versioned. The
            catch block will create the next directory and update the relative paths in the docs and versioned_docs
            directory. The then block will just update the path in the version_docs directory.
         */
        await fs.access(staticTypeNextPath)
            .then(async () => {
                let baseVersionedDocsPath = path.join(versionDocsDir, `version-${version}`);
                let relativeLinkPattern = new RegExp(`../../${staticType}/next/`, 'gm');
                let replacementText = `../${staticType}/${version}/`;
                await updateRelativePaths(baseVersionedDocsPath, relativeLinkPattern, replacementText);
            })
            .catch(async () => {
                await copyDirectory(staticTypePath, staticTypeNextPath);
                await removeFilesInDirectory(staticTypePath, "next");

                let relativeLinkPattern = new RegExp(`../${staticType}/`, 'gm');
                let replacementText = `../../${staticType}/next/`;
                await updateRelativePaths(sitePaths.docs, relativeLinkPattern, replacementText);

                replacementText = `../${staticType}/${version}/`;
                let baseVersionedDocsPath = path.join(versionDocsDir, `version-${version}`);
                await updateRelativePaths(baseVersionedDocsPath, relativeLinkPattern, replacementText);
            })
        let staticTypeVersionPath = path.join(staticTypePath, version);
        await copyDirectory(staticTypeNextPath, staticTypeVersionPath)
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
        if (exclude !== file.name) {
            await fs.rm(path.join(from, file.name), {recursive: true});
        }
    }
}

/*
  Recursive function that loops through all files in the current directory and
  subdirectories, and replaces the links in each file.
 */
async function updateRelativePaths(basePath, relativeLinkPattern, replacementText) {
    // read all files from directory
    const files = await fs.readdir(basePath, {withFileTypes: true});
    for (const file of files) {
        // if file type is a directory, a recursive call is made
        if (file.isDirectory()) {
            let subDirPath = path.join(basePath, file.name);
            await updateRelativePaths(subDirPath, relativeLinkPattern, replacementText);
        } else {
            let filePath = path.join(basePath, file.name);
            await replaceRelativePaths(filePath, relativeLinkPattern, replacementText);
        }
    }
}

async function replaceRelativePaths(filePath, relativeLinkPattern, replacementText) {
    let fileContent = await fs.readFile(filePath, {encoding: "utf8", flag: "r+"});
    // flag to set when files are modified
    let isFileContentModified = false;
    fileContent = fileContent.replace(relativeLinkPattern, function() {
        isFileContentModified = true;
        return replacementText;
    });

    // if contents have been modified then write to file
    if (isFileContentModified) {
        await fs.writeFile(filePath, fileContent);
    }
}

module.exports.versionStaticAssets = versionStaticAssets;
