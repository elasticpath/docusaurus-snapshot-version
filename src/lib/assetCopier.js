const fs = require('fs');
const path = require('path');
const util = require('util');

const readDirectory = util.promisify(fs.readdir);
const copyFile = util.promisify(fs.copyFile);
const lstatFile = util.promisify(fs.lstat);

exports.copyDocAssets = async (docsDir, version) => {
    console.info("Copying docs directory assets for the new version...");
    let pathToAssets = path.join(docsDir, "assets");
    if (!fs.existsSync(pathToAssets)) {
        return Promise.resolve();
    }
    let pathToVersionedAssets = path.join(pathToAssets, `version-${version}`);
    fs.mkdirSync(pathToVersionedAssets);
    let fileNames = await readDirectory(pathToAssets);
    return Promise.all(fileNames.map((fileName) => copyAssetFile(fileName, pathToAssets, pathToVersionedAssets)));
};

async function copyAssetFile(fileName, pathToAssets, pathToVersionedAssets) {
    let pathToSourceFile = path.join(pathToAssets, fileName);
    let sourceFileStat = await lstatFile(pathToSourceFile);
    if (sourceFileStat.isFile()) {
        let pathToDestFile = path.join(pathToVersionedAssets, fileName);
        return copyFile(pathToSourceFile, pathToDestFile, fs.constants.COPYFILE_EXCL);
    } else {
        return Promise.resolve();
    }
}