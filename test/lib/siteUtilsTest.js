const assert = require('chai').assert;
const path = require("path");

const siteUtils = require('../../src/lib/siteUtils.js')

describe("siteUtils.loadSiteProperties returns site properties object", 
    function() {

        it("Should return correct site properties", function() {
            let siteProps = siteUtils.loadSiteProperties("test/fixtures/test-site");
            assert.include(siteProps.paths.siteDir, "/test-site");
            assert.include(siteProps.paths.versionJS, path.join("pages", "en", "versions.js"));
            assert.include(siteProps.paths.versionJSON, path.join("test-site", "versions.json"));
            assert.include(siteProps.paths.siteConfig, path.join("test-site", "siteConfig.js"));
            assert.include(siteProps.paths.versionedDocs, path.join("test-site", "versioned_docs"));
            assert.include(siteProps.paths.docs, "test-docs");
            assert.deepStrictEqual(siteProps.pastVersions, ["1.0.0", "0.0.2"]);
            assert.deepStrictEqual(siteProps.siteConfig, {'customDocsPath': 'test-docs'});
        });

        it("should have empty past versions and have default value for siteProps.paths.docs", function() {
            let siteProps = siteUtils.loadSiteProperties("test/fixtures/test-site-default");
            assert.include(siteProps.paths.siteDir, "/test-site-default");
            assert.include(siteProps.paths.versionJS, path.join("pages", "en", "versions.js"));
            assert.include(siteProps.paths.versionJSON, path.join("test-site-default", "versions.json"));
            assert.include(siteProps.paths.siteConfig, path.join("test-site-default", "siteConfig.js"));
            assert.include(siteProps.paths.versionedDocs, path.join("test-site-default", "versioned_docs"));
            assert.include(siteProps.paths.docs, "docs");
            assert.deepStrictEqual(siteProps.pastVersions, []);
            assert.deepStrictEqual(siteProps.siteConfig, {});
            }
        );

        it("Should throw error when siteConfig.js is absent", function() {
            assert.throws(() => {
                siteUtils.loadSiteProperties("test/fixtures/test-site-absent-siteConfig");
            }, Error);
        });
})
