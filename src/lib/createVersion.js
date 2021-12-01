const fs = require('fs');
const shell = require('shelljs');
const diffManager = require('./diffManager');
const siteUtils = require('./siteUtils');
const assetCopier = require('./assetCopier');
const linker = require('./linker');
const staticVersioner = require('./staticVersioner')
const path = require("path");

exports.create = (version, siteDir, staticAssets) => {
	let siteProps = siteUtils.loadSiteProperties(siteDir);
	throwIfInvalidCommand(version, siteProps, staticAssets);
	return createVersion(version, siteProps, staticAssets);
}

function throwIfInvalidCommand(version, siteProps, staticAssets) {
	fs.access(siteProps.paths.versionJS, err => {
		if (err) {
			throw new Error("versions.js file is missing");
		}
	});
	if (version.includes('/')) {
		throw new TypeError("Invalid version format. (/) character is not allowed in version");
	}
	if (siteProps.pastVersions.includes(version)) {
		throw new TypeError("The specified version already exists");
	}
	if (staticAssets.length > 0) {
		staticAssets.forEach(staticType => {
			let staticTypeDirPath = path.join(siteProps.paths.staticDir, staticType);
			fs.access(staticTypeDirPath, err => {
				if (err) {
					throw new TypeError(`The ${staticType} directory does not exist under the static directory`);
				}
			})
		})
	}
}

async function createVersion(version, siteProps, staticAssets) {
	await Promise.all([diffManager.generateFileDiff(siteProps.paths.docs), diffManager.generateSidebarDiff(siteProps.paths.siteDir)]);
	console.info("Diff generation completed...");
	runDocusaurusVersionCommand(version, siteProps.paths.siteDir);
	await Promise.all([
		diffManager.cleanUpFileDiff(siteProps.paths.docs),
		diffManager.cleanUpFileDiff(siteProps.paths.versionedDocs, version),
		diffManager.cleanUpSidebarDiff(siteProps.paths.siteDir),
		diffManager.cleanUpSidebarDiff(siteProps.paths.siteDir, version),
		assetCopier.copyDocAssets(siteProps.paths.docs, version),
	]);
	if (staticAssets.length > 0) {
		await staticVersioner.versionStaticAssets(siteProps.paths, staticAssets, version);
	}
	return linker.linkAssetsInMarkdownFiles(siteProps.paths.versionedDocs, version);
}

function runDocusaurusVersionCommand(version, siteDir) {
	console.info("Calling docusaurus version command...");
	let currentDirectory = process.cwd();
	shell.cd(siteDir);
	shell.exec('yarn run version ' + version);
	shell.cd(currentDirectory);
	console.info("Docusaurus version command execution completed...");
}