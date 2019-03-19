const path = require("path");
const fs = require("fs");

exports.loadSiteProperties = (siteDir) => {
    let resolvedSiteDir = path.resolve(siteDir);
    let versionJSPath = path.join(resolvedSiteDir, "pages", "en", 
        "versions.js");
    let versionJSONPath = path.join(resolvedSiteDir, "versions.json");
    let siteConfigPath = path.join(resolvedSiteDir, "siteConfig.js");
    let versionedDocsPath = path.join(resolvedSiteDir, "versioned_docs");
    let pastVersions = [];

    if(fs.existsSync(versionJSONPath)) {
        pastVersions = JSON.parse(fs.readFileSync(versionJSONPath, 'utf-8'));
    }
    if(!fs.existsSync(siteConfigPath)) {
        throw new Error("siteConfig.js is missing from site directory: " + siteConfigPath);
    }
    let siteConfig = require(siteConfigPath);
    let docsPath = siteConfig.customDocsPath ?
        path.resolve(resolvedSiteDir, "..", siteConfig.customDocsPath):
        path.resolve(resolvedSiteDir, "..", "docs");
    
    let siteProps = {};

    siteProps.paths = {};
    siteProps.paths.siteDir = resolvedSiteDir;
    siteProps.paths.versionJS = versionJSPath;
    siteProps.paths.versionJSON = versionJSONPath;
    siteProps.paths.siteConfig = siteConfigPath;
    siteProps.paths.docs = docsPath;
    siteProps.paths.versionedDocs = versionedDocsPath;

    siteProps.pastVersions = pastVersions;
    siteProps.siteConfig = siteConfig;
    return siteProps;
}