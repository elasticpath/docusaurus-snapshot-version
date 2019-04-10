const fsExtra = require('fs-extra');
const path = require('path');

exports.copyAssets = async (docsDir, versionedDocsDir, version) => {
    let pathToAssets = path.join(docsDir, "assets");
    let pathToVersionedAssets = path.join(versionedDocsDir, `version-${version}`, "assets");
    fsExtra.mkdirSync(pathToVersionedAssets);
    return fsExtra.copy(pathToAssets, pathToVersionedAssets);
}