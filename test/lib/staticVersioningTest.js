const mockfs = require('mock-fs');
const fs = require('fs');
const assert = require('chai').assert;
const path = require('path');
const rewire = require("rewire");
const staticVersioner = rewire('../../src/lib/staticVersioner');

describe("staticVersioner should version static asset files and update the static asset file paths in the docs", function() {

    afterEach(function() {
        mockfs.restore();
    })

    it("Should return the number of versions in the versions.json file",
        async function() {
        loadMockVersionsFile();
        let getNumberOfVersions = staticVersioner.__get__('getNumberOfVersions');
        let actual = await getNumberOfVersions();
        let expectation = 1;
        assert.strictEqual(actual, expectation);
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

    it("Should update the correct relative paths in the docs directory if docs is versioned for the first time",
        async function() {
        mockDocsDir(createOneVersion());
        let docsPath = path.join(process.cwd(), 'docs');
        let updateRelativePaths = staticVersioner.__get__('updateRelativePaths');
        let staticAssets = ['img', 'javadocs'];
        await updateRelativePaths(docsPath, staticAssets);

        let actual = readDocsFiles();
        let expectation = versionedAssetPathsWithNext();
        assert.strictEqual(actual.special, expectation.special)
        assert.strictEqual(actual.index, expectation.index)
    });

    it("Should update the correct relative paths in the versioned_docs directory if docs is versioned for the first time",
        async function() {
        mockVersionedDocsDir(firstVersionAssetPaths());
        let versionedDocsPath = path.join(process.cwd(), 'versioned_docs');
        let updateRelativePaths = staticVersioner.__get__('updateRelativePaths');
        let staticAssets = ['img', 'javadocs']
        let version = '1.1.x'
        await updateRelativePaths(versionedDocsPath, staticAssets, version);

        let actual = readVersionedDocsFiles();
        let expectation = versionedAssetPaths(version);
        assert.strictEqual(actual.special, expectation.special);
        assert.strictEqual(actual.index, expectation.index);
    });

    it("Should update the correct relative paths in the versioned_docs directory for subsequent versions",
    async function() {
        mockVersionedDocsDir(versionedAssetPathsWithNext());
        let versionedDocsPath = path.join(process.cwd(), 'versioned_docs');
        let updateRelativePaths = staticVersioner.__get__('updateRelativePaths');
        let staticAssets = ['img', 'javadocs']
        let version = '1.2.x'
        await updateRelativePaths(versionedDocsPath, staticAssets, version);

        let actual = readVersionedDocsFiles();
        let expectation = versionedAssetPaths(version);
        assert.strictEqual(actual.special, expectation.special);
        assert.strictEqual(actual.index, expectation.index);
    });

    function loadMockVersionsFile() {
        mockfs({
            'versions.json': '[\n' +
                '  "1.0.x"\n' +
                ']\n'
        });
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

    function readDocsFiles() {
        let filePaths = {
            'special': path.join(process.cwd(), 'docs', 'develop-configure', 'special.md'),
            'index': path.join(process.cwd(), 'docs', 'index.md')
        }
        return {
            'special': fs.readFileSync(filePaths.special,'utf8'),
            'index': fs.readFileSync(filePaths.index, 'utf8')
        };
    }

    function createOneVersion() {
        return '[ "1.1.x" ]'
    }

    function mockDocsDir(versions) {
        mockfs({
            'versions.json': versions,
            'docs': {
                'develop-configure': {
                    'special.md': '../../javadocs/com/package-summary.html\n' +
                        '../../img/ep-logo.png'
                },
                'index.md': '../javadocs/overview-summary.html'
            },
        })
    }

    function firstVersionAssetPaths() {
        return {
            'special': '../../javadocs/com/package-summary.html\n' +
                '../../img/ep-logo.png',
            'index': '../javadocs/overview-summary.html',
            'versions': '[ "1.1.x" ]'
        };
    }

    function versionedAssetPathsWithNext() {
        return {
            'special': '../../../javadocs/next/com/package-summary.html\n' +
                '../../../img/next/ep-logo.png',
            'index': '../../javadocs/next/overview-summary.html',
            'versions': '[ "1.1.x", "1.2.x" ]'
        };
    }

    function versionedAssetPaths(version) {
        return {
            'special': `../../javadocs/${version}/com/package-summary.html\n` +
                `../../img/${version}/ep-logo.png`,
            'index': `../javadocs/${version}/overview-summary.html`,
        };
    }

    function mockVersionedDocsDir(filesToMock) {
        mockfs({
            'versions.json': filesToMock.versions,
            'versioned_docs': {
                'version-1.1.x': {
                    'develop-configure': {
                        'special.md': filesToMock.special
                    },
                    'index.md': filesToMock.index
                }
            }
        })
    }

    function readVersionedDocsFiles() {
        let filePaths = {
            'special': path.join(process.cwd(), 'versioned_docs', 'version-1.1.x', 'develop-configure', 'special.md'),
            'index': path.join(process.cwd(), 'versioned_docs', 'version-1.1.x', 'index.md'),
        }
        return {
            'special': fs.readFileSync(filePaths.special,'utf8'),
            'index': fs.readFileSync(filePaths.index, 'utf8')
        };
    }
})
