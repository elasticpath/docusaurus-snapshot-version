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

        var siteProps;
        beforeEach(function() {
            siteProps = createSitePropsStub();
            sinon.stub(siteUtils, 'loadSiteProperties').returns(siteProps);
            sinon.stub(diffManager);
            sinon.stub(assetCopier);
            sinon.stub(linker);
            sinon.stub(shell);
            sinon.stub(staticVersioner);
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(fs, 'access').returns(true);
        })

        afterEach(function() {
            sinon.restore();
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

        it("Throws error due to missing version.js file", function() {
            fs.existsSync.reset();
            assert.throws(() => createVersion.create("1.2.3", SITE_DIR, []), Error);
            assertWhenCreateVersionThrows();
        });

        it("Throws error due to version that includes (/)", function() {
            assert.throws(() => createVersion.create("1.2.3/2.4", SITE_DIR, []),
                TypeError);
            assertWhenCreateVersionThrows();  
        });

        it("Throws error due to version in argument already exists", 
            function() {
                assert.throws(() => createVersion.create("1.1.3", SITE_DIR, []),
                    TypeError);
                assertWhenCreateVersionThrows();
            }
        );

        it("Throws error due to the static asset version directory not existing", function() {
            assert.throws(() => createVersion.create("1.2.3", SITE_DIR, ['javadocs']), TypeError);
            assertWhenCreateVersionThrows();
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
