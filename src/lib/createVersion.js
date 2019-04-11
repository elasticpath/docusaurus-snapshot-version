const fs = require('fs');
const shell = require('shelljs');
const diffManager = require('./diffManager');
const siteUtils = require('./siteUtils');
const assetCopier = require('./assetCopier');
const assetLinker = require('./assetLinker');

exports.create = (version, siteDir) => {
	let siteProps = siteUtils.loadSiteProperties(siteDir);
	throwIfInvalidCommand(version, siteProps);
	return createVersion(version, siteProps);
}

function throwIfInvalidCommand(version, siteProps) {
	if (!fs.existsSync(siteProps.paths.versionJS)) {
		throw new Error("version.js file is missing");
	}
	if (typeof version === undefined) {
		throw new TypeError("Verion not specified");
	}
	if (version.includes('/')) {
		throw new TypeError("Invalid version format. (/) character is not allowed in version");
	}
	if (siteProps.pastVersions.includes(version)) {
		throw new TypeError("The specified version already exists");
	}
}

async function createVersion(version, siteProps) {
	await Promise.all([diffManager.generateFileDiff(siteProps.paths.docs), diffManager.generateSidebarDiff(siteProps.paths.siteDir)]);
	runDocusaurusVersionCommand(version, siteProps.paths.siteDir);
	await Promise.all([
		diffManager.cleanUpFileDiff(siteProps.paths.docs),
		diffManager.cleanUpFileDiff(siteProps.paths.versionedDocs, version),
		diffManager.cleanUpSidebarDiff(siteProps.paths.siteDir),
		diffManager.cleanUpSidebarDiff(siteProps.paths.siteDir, version),
		assetCopier.copyAssets(siteProps.paths.docs, siteProps.paths.versionedDocs, version)
	]);
	assetLinker.linkAssets(siteProps.paths.versionedDocs, version);
}

function runDocusaurusVersionCommand(version, siteDir) {
	let currentDirectory = process.cwd();
	shell.cd(siteDir);
	shell.exec('yarn run version ' + version);
	shell.cd(currentDirectory);
}