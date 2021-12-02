const mockfs = require('mock-fs');
const fs = require('fs');
const assert = require('chai').assert;
const expect = require('chai').expect;
const path = require('path');
const rewire = require("rewire");
const staticVersioner = rewire('../../src/lib/staticVersioner');
const sinon = require("sinon");

describe("staticVersioner should version static asset files and update the static asset file paths", function() {

    afterEach(function() {
        mockfs.restore();
    })

    describe("The docs site repository with static assets is versioned for the first time", function() {
        let siteProps = createSitePropsStub();
        const versionStaticAssets = staticVersioner.__get__('versionStaticAssets');

        let copyDirectoryStub;
        let removeFilesInDirectoryStub;
        let updateRelativePathsStub;
        let getNumberOfVersionsStub;

        let revert1;
        let revert2;
        let revert3;
        let revert4;

        beforeEach( function() {
            mockStaticDir();

            copyDirectoryStub = sinon.stub();
            removeFilesInDirectoryStub = sinon.stub();
            updateRelativePathsStub = sinon.stub();
            getNumberOfVersionsStub = sinon.stub().returns(0);

            revert1 = staticVersioner.__set__('copyDirectory', copyDirectoryStub);
            revert2 = staticVersioner.__set__('removeFilesInDirectory', removeFilesInDirectoryStub);
            revert3 = staticVersioner.__set__('updateRelativePaths', updateRelativePathsStub);
            revert4 = staticVersioner.__set__('getNumberOfVersions', getNumberOfVersionsStub);
        })

        afterEach(function() {
            revert1();
            revert2();
            revert3();
            revert4();
        })

        it ("Should call copyDirectory twice, removeFiles once, and updateRelativePaths twice",
            async function() {
                await versionStaticAssets(siteProps.paths, ['javadocs'], '1.0.x')

                sinon.assert.callCount(copyDirectoryStub, 2);
                sinon.assert.callCount(removeFilesInDirectoryStub, 1);
                sinon.assert.callCount(updateRelativePathsStub, 2);
            });

        it ("Should call the updateRelativePaths function with the correct parameters",
            async function() {
                await versionStaticAssets(siteProps.paths, ['javadocs'], '1.0.x')

                expect(updateRelativePathsStub.getCall(0).calledWithExactly(
                    siteProps.paths.docs,
                    new RegExp(`../javadocs/`, 'gm'),
                    `../../javadocs/next/`)).to.be.true;

                expect(updateRelativePathsStub.getCall(1).calledWithExactly(
                    path.join(siteProps.paths.versionedDocs, 'version-1.0.x'),
                    new RegExp(`../javadocs/`, 'gm'),
                    `../javadocs/1.0.x/`)).to.be.true;
            });
    });

    describe("The docs site repository with static assets is versioned subsequently", function() {
        let copyDirectoryStub;
        let updateRelativePathsStub;

        let revert1;
        let revert2;

        beforeEach( function() {
            mockStaticDirWithNextAndVersion();

            copyDirectoryStub = sinon.stub();
            updateRelativePathsStub = sinon.stub();

            revert1 = staticVersioner.__set__('copyDirectory', copyDirectoryStub);
            revert2 = staticVersioner.__set__('updateRelativePaths', updateRelativePathsStub);
        })

        afterEach(function() {
            revert1();
            revert2();
        })

        it ("Should call copyDirectory once and updateRelativePaths once",
            async function() {
                let siteProps = createSitePropsStub();

                const versionStaticAssets = staticVersioner.__get__('versionStaticAssets');
                await versionStaticAssets(siteProps.paths, ['javadocs'], '1.1.x')

                sinon.assert.callCount(copyDirectoryStub, 1);
                sinon.assert.callCount(updateRelativePathsStub, 1);
            });

        it ("Should call the updateRelativePaths function with the correct parameters",
            async function() {
                let siteProps = createSitePropsStub();

                const versionStaticAssets = staticVersioner.__get__('versionStaticAssets');
                await versionStaticAssets(siteProps.paths, ['javadocs'], '1.1.x')

                expect(updateRelativePathsStub.getCall(0).calledWithExactly(
                    path.join(siteProps.paths.versionedDocs, 'version-1.1.x'),
                    new RegExp(`../../javadocs/next/`, 'gm'),
                    `../javadocs/1.1.x/`)).to.be.true;
            });
    });

    describe("The first time a static asset type is versioned, but the docs site repository has already been versioned", function() {
        let siteProps = createSitePropsStub();
        const versionStaticAssets = staticVersioner.__get__('versionStaticAssets');

        let copyDirectoryStub;
        let removeFilesInDirectoryStub;
        let updateRelativePathsStub;
        let getNumberOfVersionsStub;

        let revert1;
        let revert2;
        let revert3;
        let revert4;

        beforeEach( function() {
            mockStaticDir();

            copyDirectoryStub = sinon.stub();
            removeFilesInDirectoryStub = sinon.stub();
            updateRelativePathsStub = sinon.stub();
            getNumberOfVersionsStub = sinon.stub().returns(2);

            revert1 = staticVersioner.__set__('copyDirectory', copyDirectoryStub);
            revert2 = staticVersioner.__set__('removeFilesInDirectory', removeFilesInDirectoryStub);
            revert3 = staticVersioner.__set__('updateRelativePaths', updateRelativePathsStub);
            revert4 = staticVersioner.__set__('getNumberOfVersions', getNumberOfVersionsStub);
        })

        afterEach(function() {
            revert1();
            revert2();
            revert3();
            revert4();
        })

        it ("Should call copyDirectory twice, removeFiles once, and updateRelativePaths twice",
            async function() {
                await versionStaticAssets(siteProps.paths, ['javadocs'], '1.1.x')

                sinon.assert.callCount(copyDirectoryStub, 2);
                sinon.assert.callCount(removeFilesInDirectoryStub, 1);
                sinon.assert.callCount(updateRelativePathsStub, 2);
            });

        it ("Should call the updateRelativePaths function with the correct parameters",
            async function() {
                await versionStaticAssets(siteProps.paths, ['javadocs'], '1.1.x')

                expect(updateRelativePathsStub.getCall(0).calledWithExactly(
                    siteProps.paths.docs,
                    new RegExp(`../javadocs/`, 'gm'),
                    `../javadocs/next/`)).to.be.true;

                expect(updateRelativePathsStub.getCall(1).calledWithExactly(
                    path.join(siteProps.paths.versionedDocs, 'version-1.1.x'),
                    new RegExp(`../../javadocs/`, 'gm'),
                    `../javadocs/1.1.x/`)).to.be.true;
            });
    });

    describe("A different static asset type is versioned for the first time but the docs site repository with static assets has already been versioned",function() {
        let siteProps = createSitePropsStub();
        const versionStaticAssets = staticVersioner.__get__('versionStaticAssets');

        let copyDirectoryStub;
        let removeFilesInDirectoryStub;
        let updateRelativePathsStub;
        let getNumberOfVersionsStub;

        let revert1;
        let revert2;
        let revert3;
        let revert4;

        beforeEach( function() {
            mockStaticDirWithNextAndVersion();

            copyDirectoryStub = sinon.stub();
            removeFilesInDirectoryStub = sinon.stub();
            updateRelativePathsStub = sinon.stub();
            getNumberOfVersionsStub = sinon.stub().returns(2);

            revert1 = staticVersioner.__set__('copyDirectory', copyDirectoryStub);
            revert2 = staticVersioner.__set__('removeFilesInDirectory', removeFilesInDirectoryStub);
            revert3 = staticVersioner.__set__('updateRelativePaths', updateRelativePathsStub);
            revert4 = staticVersioner.__set__('getNumberOfVersions', getNumberOfVersionsStub);
        })

        afterEach(function() {
            revert1();
            revert2();
            revert3();
            revert4();
        })

        it ("Should call copyDirectory three times, removeFilesInDirectory once, and updateRelativePaths three times",
            async function() {
                await versionStaticAssets(siteProps.paths, ['javadocs', 'img'], '1.1.x')

                sinon.assert.callCount(copyDirectoryStub, 3);
                sinon.assert.callCount(removeFilesInDirectoryStub, 1);
                sinon.assert.callCount(updateRelativePathsStub, 3);
            });

        it ("Should call the updateRelativePaths functions with the correct parameters",
            async function() {
                await versionStaticAssets(siteProps.paths, ['javadocs', 'img'], '1.1.x')

                expect(updateRelativePathsStub.getCall(0).calledWithExactly(
                    path.join(siteProps.paths.versionedDocs, 'version-1.1.x'),
                    new RegExp(`../../javadocs/next/`, 'gm'),
                    `../javadocs/1.1.x/`)).to.be.true;

                expect(updateRelativePathsStub.getCall(1).calledWithExactly(
                    siteProps.paths.docs,
                    new RegExp(`../img/`, 'gm'),
                    `../img/next/`)).to.be.true;

                expect(updateRelativePathsStub.getCall(2).calledWithExactly(
                    path.join(siteProps.paths.versionedDocs, 'version-1.1.x'),
                    new RegExp(`../../img/`, 'gm'),
                    `../img/1.1.x/`)).to.be.true;
            });
    });

    describe("Test private functions", function() {
        it("Should copy everything from one directory to another directory",
            async function() {
                mockJavaDocsDirectory();
                let javaDocsPath = path.join(process.cwd(), 'javadocs')
                let javaDocsNextPath = path.join(javaDocsPath, 'next')
                let copyDirectory = staticVersioner.__get__('copyDirectory');
                await copyDirectory(javaDocsPath, javaDocsNextPath);
                let actual = fs.readdirSync(javaDocsNextPath);
                let expectation = ["com", "index.html", "overview-summary.html"];
                expectation.forEach(fileName => assert.include(actual, fileName))
            });

            it("Should throw error code EEXIST if the directory to copy to exists",
            async function() {
                mockJavaDocsDirectory();
                let javaDocsPath = path.join(process.cwd(), 'javadocs')
                let javaDocsNextPath = path.join(javaDocsPath, 'com')
                let copyDirectory = staticVersioner.__get__('copyDirectory');
                await copyDirectory(javaDocsPath, javaDocsNextPath)
                    .catch((err) => {
                        assert.strictEqual(err.code, 'EEXIST')
                    })
            });

        it("Should remove everything inside the directory",
            async function() {
                mockJavaDocsDirectory();
                let javaDocsPath = path.join(process.cwd(), 'javadocs');
                let removeFilesInDirectory = staticVersioner.__get__('removeFilesInDirectory');
                let toExclude = []
                await removeFilesInDirectory(javaDocsPath, toExclude);
                let actual = fs.readdirSync(javaDocsPath);
                assert.isEmpty(actual);
            });

        it("Should not remove the specified file and/or subdirectory",
            async function() {
                mockJavaDocsDirectory();
                let javaDocsPath = path.join(process.cwd(), 'javadocs');
                let removeFilesInDirectory = staticVersioner.__get__('removeFilesInDirectory');
                let toExclude = ['com', 'index.html']
                await removeFilesInDirectory(javaDocsPath, toExclude);
                let actual = fs.readdirSync(javaDocsPath);
                toExclude.forEach(excluded => assert.include(actual, excluded))
            });

        it("Should not remove the specified file and/or subdirectory if the exclude is passed as a String",
            async function() {
                mockJavaDocsDirectory();
                let javaDocsPath = path.join(process.cwd(), 'javadocs');
                let removeFilesInDirectory = staticVersioner.__get__('removeFilesInDirectory');
                let toExclude = "next"
                await removeFilesInDirectory(javaDocsPath, toExclude)
                    .catch((err) => {
                        if (err) {
                            console.log(err.type);
                        }
                    });
            });

        it("Should call the replaceRelativePath function each time it finds a file",
            async function() {
                mockFileSystem();
                let basePath = path.join(process.cwd(), 'directory1');
                let pattern = new RegExp('/some-pattern/');
                let replacement = new RegExp('/some-replacement/');
                let stub = sinon.stub();
                let revert = staticVersioner.__set__('replaceRelativePaths', stub);
                let updateRelativePaths = staticVersioner.__get__('updateRelativePaths');
                await updateRelativePaths(basePath, pattern, replacement);
                sinon.assert.callCount(stub, 4);
                revert();

            });

        it("Should not call the replaceRelativePath function in an empty directory",
            async function() {
                mockFileSystem();
                let basePath = path.join(process.cwd(), 'directory2');
                let pattern = new RegExp('/some-pattern/');
                let replacement = new RegExp('/some-replacement/');
                let stub = sinon.stub();
                let revert = staticVersioner.__set__('replaceRelativePaths', stub);
                let updateRelativePaths = staticVersioner.__get__('updateRelativePaths');
                await updateRelativePaths(basePath, pattern, replacement);
                sinon.assert.callCount(stub, 0);
                revert();
            });

        it("Should only update file contents that match the regex pattern to the specified text",
            async function() {
                mockDocsDir();
                let filePath = path.join(process.cwd(), 'docs', 'index.md');
                let pattern =  new RegExp(`../javadocs/`, 'gm');
                let replacement = `../../javadocs/next/`;

                let replaceRelativePaths = staticVersioner.__get__('replaceRelativePaths');
                await replaceRelativePaths(filePath, pattern, replacement)

                let actual = fs.readFileSync(filePath, 'utf8');
                let expectation =
                    '../../javadocs/next/overview-summary.html\n' +
                    '../../javadocs/next/index.html\n' +
                    '../img/favicon/ep-logo-small.png'
                assert.strictEqual(actual, expectation);
            });

        it("Should throw error code ENOENT if the path doesn't exist",
            async function() {
                mockDocsDir();
                let filePath = path.join(process.cwd(), 'docs', 'dne.md');
                let pattern =  new RegExp(`../javadocs/`, 'gm');
                let replacement = `../../javadocs/next/`;

                let replaceRelativePaths = staticVersioner.__get__('replaceRelativePaths');

                await replaceRelativePaths(filePath, pattern, replacement)
                    .catch((err) => {
                        assert.strictEqual(err.code, 'ENOENT')
                    }
                )
            });
    });

    function createSitePropsStub() {
        let siteDir = path.resolve(".");
        return {
            "paths": {
                "siteDir": siteDir,
                "docs": path.resolve(siteDir, "..", "docs"),
                "versionedDocs": `${path.join(siteDir, "versioned_docs")}`,
                "staticDir": `${path.join(siteDir, "static")}`,
            }
        }
    }

    function mockStaticDir() {
        mockfs({
            'static': {
                'javadocs': {},
            }
        })
    }

    function mockStaticDirWithNextAndVersion() {
        mockfs({
            'static': {
                'javadocs': {
                    'next': {},
                    '1.0.x' : {}
                },
                'img': {}
            }
        })
    }

    function mockJavaDocsDirectory() {
        mockfs({
            'javadocs': {
                'com': {},
                'overview-summary.html': 'file content here',
                'index.html': 'file content here'
            }
        });
    }

    function mockFileSystem() {
        mockfs({
            'directory1': {
                'file1': '',
                'subdirectory1': {
                    'file2': '',
                    'file3': '',
                },
                'subdirectory2': {
                    'file4': '',
                },
            },
            'directory2': {}
        })
    }

    function mockDocsDir() {
        mockfs({
            'docs': {
                'index.md':
                    '../javadocs/overview-summary.html\n' +
                    '../javadocs/index.html\n' +
                    '../img/favicon/ep-logo-small.png'
            },
        })
    }
})
