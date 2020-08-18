const fs = require('fs');
const glob = require('glob');
const path = require('path');
const util = require('util');
const MARKDOWN_PATTERN = path.join("**", "*.md");
const LINKED_ASSET_REGEX = new RegExp(/(?<=!\[[^\]()'"]*?\]\(assets)\/(?=[\w\s,-]+?\.[A-Za-z]+?\))/, 'g');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

exports.linkAssetsInMarkdownFiles = (versionedDocsDir, version) => {
    console.info("Linking versioned asset and relative links in versioned markdown files...");
    let pathToVDocs = path.join(versionedDocsDir, `version-${version}`, MARKDOWN_PATTERN);
    let files = glob.sync(pathToVDocs);
    return Promise.all(files.map((file) => linkAssetsInFile(file, version)));
}

async function linkAssetsInFile(file, version) {
    let fileContent = await readFile(file, 'utf8');
    let linkedFileContent = replaceAssetLinks(fileContent, version);
    if (linkedFileContent) {
        await writeFile(file, linkedFileContent, 'utf8');
    }
}

function replaceAssetLinks(fileContent, version) {
    if (!fileContent) {
        return undefined;
    }
    return fileContent.replace(LINKED_ASSET_REGEX, `/version-${version}/`);
}