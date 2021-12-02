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
const staticVersioner = require('../../src/lib/staticVersioner');

const SITE_DIR = ".";

describe('createVersion does preliminary checks and calls diffManager', 
    function() {
        let accessStub;
        let siteProps;

        beforeEach(function() {
            siteProps = createSitePropsStub();
            accessStub = sinon.stub(fs, 'access');
            sinon.stub(siteUtils, 'loadSiteProperties').returns(siteProps);
            sinon.stub(diffManager);
            sinon.stub(assetCopier);
            sinon.stub(linker);
            sinon.stub(shell);
            sinon.stub(staticVersioner);
        })

        afterEach(function() {
            sinon.restore();
            accessStub.restore();
        });

        it("Should execute the command and call diffManager and assertCopier",
            async function () {
                await createVersion.create("1.2.3", SITE_DIR, [])
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

                sinon.assert.calledOnce(assetCopier.copyDocAssets);
                sinon.assert.calledWithExactly(assetCopier.copyDocAssets, siteProps.paths.docs, "1.2.3");

                sinon.assert.notCalled(staticVersioner.versionStaticAssets);

                sinon.assert.calledOnce(linker.linkAssetsInMarkdownFiles);
                sinon.assert.calledWithExactly(linker.linkAssetsInMarkdownFiles,
                    siteProps.paths.versionedDocs, "1.2.3");
        });

        it("Should execute the command and call diffManager, assertCopier, and staticVersioner",
            async function () {
                await createVersion.create("1.2.3", SITE_DIR, ['javadocs'])
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

                sinon.assert.calledOnce(assetCopier.copyDocAssets);
                sinon.assert.calledWithExactly(assetCopier.copyDocAssets, siteProps.paths.docs, "1.2.3");

                sinon.assert.calledOnce(staticVersioner.versionStaticAssets);
                sinon.assert.calledWithExactly(staticVersioner.versionStaticAssets, siteProps.paths, ['javadocs'], "1.2.3");

                sinon.assert.calledOnce(linker.linkAssetsInMarkdownFiles);
                sinon.assert.calledWithExactly(linker.linkAssetsInMarkdownFiles, siteProps.paths.versionedDocs, "1.2.3");
        });

        it("Should throw an error if the version.js file is missing", function() {
            let msg = 'versions.js file is missing';
            accessStub.yields(new Error(msg));
            assert.throws(() => createVersion.create("1.2.3", SITE_DIR, []), Error, msg);
            assertWhenCreateVersionThrows();
        });

        it("Should not throw an error since the versions.js file exists", function() {
            accessStub.yields(null);
            assert.doesNotThrow(() => createVersion.create("1.2.3", SITE_DIR, []), Error);
        });

        it("Should throw an error if the version includes (/)", function() {
            assert.throws(() => createVersion.create("1.2.3/2.4", SITE_DIR, []),
                TypeError);
            assertWhenCreateVersionThrows();  
        });

        it("Should not throw an error since the version does not include (/)", function() {
            assert.doesNotThrow(() => createVersion.create("1.2.3", SITE_DIR, []),
                TypeError);
        });

        it("Should throw an error if the provided version already exists",
            function() {
                assert.throws(() => createVersion.create("1.1.3", SITE_DIR, []),
                    TypeError);
                assertWhenCreateVersionThrows();
            }
        );

        it("Should not throw an error since the provided version does not already exists",
            function() {
                assert.doesNotThrow(() => createVersion.create("1.1.1", SITE_DIR, []),
                    TypeError);
            }
        );

        /*
          Two stubs need to be set for fs.access because the function that checks for validations has an fs.access at
          the beginning of the function. When we pass null to the first stub, it means the first validation has passed,
          allowing us to isolate the test for the other validation that uses fs.access.
         */
        it("Should throw an error if the static asset directory does not exist", function() {
            accessStub.onCall(0).yields(null);
            let msg = 'The img directory does not exist under the static directory';
            accessStub.onCall(1).yields(new Error(msg));
            assert.throws(() => createVersion.create("1.2.3", SITE_DIR, ['img']), Error, msg);
            assertWhenCreateVersionThrows();
        });

        it("Should not throw an error since the static asset directory already exists", function() {
            accessStub.onCall(0).yields(null);
            accessStub.onCall(1).yields(null);
            assert.doesNotThrow(() => createVersion.create("1.2.3", SITE_DIR, ['img']));
        });

        function assertWhenCreateVersionThrows() {
            sinon.assert.calledWithExactly(siteUtils.loadSiteProperties, SITE_DIR);
            sinon.assert.notCalled(diffManager.generateFileDiff);
            sinon.assert.notCalled(diffManager.cleanUpFileDiff);
            sinon.assert.notCalled(assetCopier.copyDocAssets);
            sinon.assert.notCalled(linker.linkAssetsInMarkdownFiles);
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
                    "versionedDocs": `${path.join(siteDir, "versioned_docs")}`,
                    "staticDir": `${path.join(siteDir, "static")}`,
                },
                "pastVersions": [
                    "1.1.3",
                    "2.0.4",
                    "0.0.45"
                ]
            }
        }
});
