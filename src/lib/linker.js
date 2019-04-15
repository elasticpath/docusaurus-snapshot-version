const fs = require('fs');
const glob = require('glob');
const path = require('path');
const util = require('util');
const MARKDOWN_PATTERN = path.join("**", "*.md");
const LINKED_ASSET_REGEX = new RegExp(/(?<=!\[[^\]()'"]*?\]\(assets)\/(?=[\w\s,-]+?\.[A-Za-z]+?\))/, 'g');
const LINKED_MARKDOWN_REGEX = new RegExp(/(?<=\[[^\]]+?\]\([^)#]+?\.)md(?=#?[^.)]*?\))/, 'g');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

exports.linkAssetsAndMarkdownFiles = (versionedDocsDir, version) => {
    console.info("Linking versioned asset and relative links in versioned markdown files...");
    let pathToVDocs = path.join(versionedDocsDir, `version-${version}`, MARKDOWN_PATTERN);
    let files = glob.sync(pathToVDocs);
    return Promise.all(files.map((file) => link(file, version)));
}

async function link(file, version) {
    let fileContent = await readFile(file, 'utf8');
    let linkedFileContent = replaceLinks(fileContent, version);
    if (linkedFileContent) {
        await writeFile(file, linkedFileContent, 'utf8');
    }
}

function replaceLinks(fileContent, version) {
    if (!fileContent) {
        return undefined;
    }
    let linkedFileContent = fileContent.replace(LINKED_ASSET_REGEX, `/version-${version}/`);
    return linkedFileContent.replace(LINKED_MARKDOWN_REGEX, "html");
}