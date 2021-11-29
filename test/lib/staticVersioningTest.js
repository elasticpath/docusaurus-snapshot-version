const mockfs = require('mock-fs');
const fs = require('fs');
const assert = require('chai').assert;
const path = require('path');
const rewire = require("rewire");
const staticVersioner = rewire('../../src/lib/staticVersioner');

const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

describe("staticVersioner should version static asset files and update the static asset file paths in the docs", function() {

    afterEach(function() {
        mockfs.restore();
    })

    it ("Should call the functions in the catch block of fs.access and call copyDirectory after fs.access",
        async function() {
            mockStaticDir();
            let siteProps = createSitePropsStub();

            let copyDirectoryStub = sinon.stub();
            staticVersioner.__set__('copyDirectory', copyDirectoryStub);
            let removeFilesInDirectoryStub = sinon.stub();
            staticVersioner.__set__('removeFilesInDirectory', removeFilesInDirectoryStub);
            let updateRelativePathsStub = sinon.stub();
            staticVersioner.__set__('updateRelativePaths', updateRelativePathsStub);

            const versionStaticAssets = staticVersioner.__get__('versionStaticAssets');
            await versionStaticAssets(siteProps.paths, ['javadocs'], '1.0.x')

            sinon.assert.callCount(copyDirectoryStub, 2);
            sinon.assert.callCount(removeFilesInDirectoryStub, 1);
            sinon.assert.callCount(updateRelativePathsStub, 2);
            sinon.assert.callOrder(copyDirectoryStub, removeFilesInDirectoryStub, updateRelativePathsStub, updateRelativePathsStub, copyDirectoryStub);
    });

    it ("Should call the functions in the then block of fs.access and call copyDirectory after fs.access",
        async function() {
            mockStaticDirWithNextAndVersion();
            let siteProps = createSitePropsStub();

            let copyDirectoryStub = sinon.stub();
            staticVersioner.__set__('copyDirectory', copyDirectoryStub);
            let updateRelativePathsStub = sinon.stub();
            staticVersioner.__set__('updateRelativePaths', updateRelativePathsStub);

            const versionStaticAssets = staticVersioner.__get__('versionStaticAssets');
            await versionStaticAssets(siteProps.paths, ['javadocs'], '1.0.x')

            sinon.assert.callCount(copyDirectoryStub, 1);
            sinon.assert.callCount(updateRelativePathsStub, 1);
            sinon.assert.callOrder(updateRelativePathsStub, copyDirectoryStub);
    });

    it ("Should call the functions in the then block and call. Then call the functions in the catch block. Then call copyDirectory after each fs.access",
        async function() {
            mockStaticDirWithNextAndVersion();
            let siteProps = createSitePropsStub();

            let copyDirectoryStub = sinon.stub();
            staticVersioner.__set__('copyDirectory', copyDirectoryStub);
            let removeFilesInDirectoryStub = sinon.stub();
            staticVersioner.__set__('removeFilesInDirectory', removeFilesInDirectoryStub);
            let updateRelativePathsStub = sinon.stub();
            staticVersioner.__set__('updateRelativePaths', updateRelativePathsStub);

            const versionStaticAssets = staticVersioner.__get__('versionStaticAssets');
            await versionStaticAssets(siteProps.paths, ['javadocs', 'img'], '1.0.x')

            sinon.assert.callCount(copyDirectoryStub, 3);
            sinon.assert.callCount(removeFilesInDirectoryStub, 1);
            sinon.assert.callCount(updateRelativePathsStub, 3);
            sinon.assert.callOrder(updateRelativePathsStub, copyDirectoryStub);
    });

    it("Should copy everything from one directory to another directory",
        async function() {
            mockJavaDocsDirectory();
            let javaDocsPath = path.join(process.cwd(), 'javadocs')
            let javaDocsNextPath = path.join(javaDocsPath, 'next')
            let copyDirectory = staticVersioner.__get__('copyDirectory');
            await copyDirectory(javaDocsPath, javaDocsNextPath);
            let actual = fs.readdirSync(javaDocsNextPath);
            console.log(actual)
            let expectation = ["com", "index.html", "overview-summary.html"];
            expectation.forEach(fileName => assert.include(actual, fileName))
    });

    it("Should remove files and subdirectories from the chosen directory except what is excluded",
        async function() {
            mockJavaDocsDirectory();
            let javaDocsPath = path.join(process.cwd(), 'javadocs');
            let removeFilesInDirectory = staticVersioner.__get__('removeFilesInDirectory');
            let toExclude = ['com', 'index.html']
            await removeFilesInDirectory(javaDocsPath, toExclude);
            let actual = fs.readdirSync(javaDocsPath).length;
            toExclude.forEach(excluded => assert.notInclude(excluded, actual))
    });

    it("Should call the replaceRelativePath function four times",
        async function() {
            mockFileSystem();
            let basePath = path.join(process.cwd(), 'directory1');
            let pattern = new RegExp('/some-pattern/');
            let replacement = new RegExp('/some-replacement/');
            let stub = sinon.stub();
            staticVersioner.__set__('replaceRelativePaths', stub);
            let updateRelativePaths = staticVersioner.__get__('updateRelativePaths');
            await updateRelativePaths(basePath, pattern, replacement);
            sinon.assert.callCount(stub, 4)
    });

    it("Should not call the replaceRelativePath function any number of times",
        async function() {
            mockFileSystem();
            let basePath = path.join(process.cwd(), 'directory2');
            let pattern = new RegExp('/some-pattern/');
            let replacement = new RegExp('/some-replacement/');
            let stub = sinon.stub();
            staticVersioner.__set__('replaceRelativePaths', stub);
            let updateRelativePaths = staticVersioner.__get__('updateRelativePaths');
            await updateRelativePaths(basePath, pattern, replacement);
            sinon.assert.callCount(stub, 0)
    });

    it("Should only update the javadocs paths within files in the docs directory to the specified regex pattern",
        async function() {
            mockDocsDir(firstTimeVersioningDocsFiles());
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
            assert.strictEqual(actual, expectation)
    });

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

    function mockDocsDir(fileContent) {
        mockfs({
            'docs': {
                'index.md': fileContent.index
            },
        })
    }

    function firstTimeVersioningDocsFiles() {
        return {
            'index':
                '../javadocs/overview-summary.html\n' +
                '../javadocs/index.html\n' +
                '../img/favicon/ep-logo-small.png'
        }
    }

    function createSitePropsStub() {
        let siteDir = path.resolve(".");
        return {
            "paths": {
                "siteDir": siteDir,
                "versionedDocs": `${path.join(siteDir, "versioned_docs")}`,
                "staticDir": `${path.join(siteDir, "static")}`,
            }
        }
    }
})
