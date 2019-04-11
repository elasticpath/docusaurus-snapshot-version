const fs = require('fs');
const glob = require('glob');
const path = require('path');
const util = require('util');
const MARKDOWN_PATTERN = path.join('**', '*.md');
const DIFFHTMLCOMMENT = "<!---This is a comment added by snapshot versioning script as a workaround for document versioning>";
const BYTESTOREMOVE = Buffer.byteLength(DIFFHTMLCOMMENT);

const openFile = util.promisify(fs.open);
const appendFile = util.promisify(fs.appendFile);
const closeFile = util.promisify(fs.close);
const statFile = util.promisify(fs.stat);
const truncateFile = util.promisify(fs.truncate);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlinkFile = util.promisify(fs.unlink);


exports.generateFileDiff = async (docsPath) => {
    console.info("Generating diff in markdown files...");
    let files = glob.sync(path.join(docsPath, MARKDOWN_PATTERN));
    return Promise.all(files.map(addDiff));
}

exports.cleanUpFileDiff = async (docsPath, version = "") => {
    let pathToDocs;
    if (version === "") {
        pathToDocs = path.join(docsPath, MARKDOWN_PATTERN);
        console.info("Cleaning up diff from markdown files...");
    } else {
        pathToDocs = path.join(docsPath, `version-${version}`, 
            MARKDOWN_PATTERN);
        console.info("Cleaning up diff from versioned markdown files...");
    }
    let files = glob.sync(pathToDocs); 
    return Promise.all(files.map(cleanUpDiff));
}

exports.generateSidebarDiff = async (siteDir) => {
    console.info("Generating diff in sidebars.json...");
    let pathToSidebar = path.join(siteDir, "sidebars.json");
    let sidebarRawContent = await readFile(pathToSidebar, 'utf8');
    let sidebar = JSON.parse(sidebarRawContent);
    sidebar.toBeDeleted = {};
    await unlinkFile(pathToSidebar);
    return writeFile(pathToSidebar, JSON.stringify(sidebar, null, 2), 'utf8');
}

exports.cleanUpSidebarDiff = async (siteDir, version = "") => {
    let pathToSidebar;
    let toBeDeletedProperty;
    if (version === "") {
        pathToSidebar = path.join(siteDir, "sidebars.json");
        toBeDeletedProperty = "toBeDeleted";
        console.info("Cleaning up diff from sidebars...");
    } else {
        pathToSidebar = path.join(siteDir, "versioned_sidebars", `version-${version}-sidebars.json`);
        toBeDeletedProperty = `version-${version}-toBeDeleted`;
        console.info("Cleaning up diff from versioned sidebars...");
    }
    return deleteFromSidebar(pathToSidebar, toBeDeletedProperty);
}

async function deleteFromSidebar(pathToSidebar, toBeDeletedProperty) {
    let sidebarRawContent = await readFile(pathToSidebar, 'utf8');
    let sidebar = JSON.parse(sidebarRawContent);
    delete sidebar[toBeDeletedProperty];
    await unlinkFile(pathToSidebar);
    return writeFile(pathToSidebar, JSON.stringify(sidebar, null, 2), 'utf8');
}

async function addDiff(file) {
    let fd;
    try {
        fd = await openFile(file, 'a');
        await appendFile(fd, DIFFHTMLCOMMENT);
    } finally {
        await closeFile(fd);
    }
}

async function cleanUpDiff(file) {
    let stats = await statFile(file);
    let fileContentBytes = stats.size - BYTESTOREMOVE;
    return truncateFile(file, fileContentBytes);
}