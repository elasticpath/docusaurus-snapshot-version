const sinon = require('sinon');
const assert = require('chai').assert;

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const createVersion = require('../../src/lib/createVersion.js');
const diffManager = require('../../src/lib/diffManager.js');
const siteUtils = require('../../src/lib/siteUtils.js');
const assetCopier = require('../../src/lib/assetCopier.js');
const linker = require('../../src/lib/linker.js');

const SITE_DIR = ".";

describe('createVersion does preliminary checks and calls diffManager', 
    function() {

        var siteProps;
        beforeEach(function() {
            siteProps = createSitePropsStub();
            sinon.stub(siteUtils, 'loadSiteProperties').returns(siteProps);
            sinon.stub(diffManager);
            sinon.stub(assetCopier);
            sinon.stub(linker);
            sinon.stub(shell);
            sinon.stub(fs, 'existsSync').returns(true);
        }) 

        afterEach(function() {
            sinon.restore();
        });

        it("Should execute the command and call diffManager, assertCopier", 
            async function () {
                await createVersion.create("1.2.3", SITE_DIR)
                sinon.assert.calledWithExactly(siteUtils.loadSiteProperties, SITE_DIR);

                sinon.assert.calledOnce(diffManager.generateFileDiff);
                sinon.assert.calledWithExactly(diffManager.generateFileDiff, siteProps.paths.docs);
    
                sinon.assert.calledWithExactly(diffManager.cleanUpFileDiff,siteProps.paths.docs);
                sinon.assert.calledWithExactly(diffManager.cleanUpFileDiff,siteProps.paths.versionedDocs, "1.2.3");
                sinon.assert.calledTwice(diffManager.cleanUpFileDiff);

                sinon.assert.calledOnce(diffManager.generateSidebarDiff);
                sinon.assert.calledWithExactly(diffManager.generateSidebarDiff,
                    siteProps.paths.siteDir);
                sinon.assert.calledTwice(diffManager.cleanUpSidebarDiff);
                sinon.assert.calledWithExactly(diffManager.cleanUpSidebarDiff,
                    siteProps.paths.siteDir);
                sinon.assert.calledWithExactly(diffManager.cleanUpSidebarDiff,
                    siteProps.paths.siteDir, "1.2.3");
    
                sinon.assert.calledTwice(shell.cd);
                sinon.assert.calledWithExactly(shell.cd, process.cwd());
                sinon.assert.calledWithExactly(shell.cd, siteProps.paths.siteDir);
                sinon.assert.calledWithExactly(shell.exec, 
                    'yarn run version 1.2.3');
                sinon.assert.calledOnce(shell.exec);

                sinon.assert.calledOnce(assetCopier.copyAssets);
                sinon.assert.calledWithExactly(assetCopier.copyAssets, siteProps.paths.docs, "1.2.3");

                sinon.assert.calledOnce(linker.linkAssetsAndMarkdownFiles);
                sinon.assert.calledWithExactly(linker.linkAssetsAndMarkdownFiles,
                    siteProps.paths.versionedDocs, "1.2.3");
        });

        it("Throws error due to missing version.js file", function() {
            fs.existsSync.reset();
            assert.throws(() => createVersion.create("1.2.3", SITE_DIR), Error);
            assertWhenCreateVersionThrows();
        });

        it("Throws error due to undefined version", function() {
            assert.throws(() => createVersion.create(undefined, SITE_DIR), TypeError);
            assertWhenCreateVersionThrows();    
        });

        it("Throws error due to version that includes (/)", function() {
            assert.throws(() => createVersion.create("1.2.3/2.4", SITE_DIR), 
                TypeError);
            assertWhenCreateVersionThrows();  
        });

        it("Throws error due to version in argument already exists", 
            function() {
                assert.throws(() => createVersion.create("1.1.3", SITE_DIR), 
                    TypeError);
                assertWhenCreateVersionThrows();
            }
        );

        function assertWhenCreateVersionThrows() {
            sinon.assert.calledWithExactly(siteUtils.loadSiteProperties, SITE_DIR);
            sinon.assert.notCalled(diffManager.generateFileDiff);
            sinon.assert.notCalled(diffManager.cleanUpFileDiff);
            sinon.assert.notCalled(assetCopier.copyAssets);
            sinon.assert.notCalled(linker.linkAssetsAndMarkdownFiles);
            sinon.assert.notCalled(shell.cd);
            sinon.assert.notCalled(shell.exec);
        }

        function createSitePropsStub() {
            let siteDir = path.resolve(SITE_DIR);
            return {
                "paths": {
                    "siteDir": siteDir,
                    "versionJS": `${path.join(siteDir, "pages", "en", "version.js")}`,
                    "docs": `${path.resolve(siteDir, "..", "docs")}`,
                    "versionedDocs": `${path.join(siteDir, "versioned_docs")}`
                },
                "pastVersions": [
                    "1.1.3",
                    "2.0.4",
                    "0.0.45"
                ]
            }
        }
});
