const mockfs = require('mock-fs');
const fs = require('fs');
const assert = require('chai').assert;
const path = require('path');
const diffManager = require('../../src/lib/diffManager.js');
const DIFFHTMLCOMMENT = "<!---This is a comment added by snapshot versioning script as a workaround for document versioning>";

describe("Diff Manager should generate and cleanup diffs", function() {

    afterEach(function() {
        mockfs.restore();
    })

    it("Should generate diff by adding appropriate html comment", 
        async function() {
            mockFileSystem(createFileContent());
            await diffManager.generateFileDiff(path.join(process.cwd(), 'docs'))
            let expectation = createFileContentWithDiff();
            let actual = readFiles();
            assert.strictEqual(actual.apiOverview, expectation.apiOverview);
            assert.strictEqual(actual.apiPostCart, expectation.apiPostCart);
            assert.strictEqual(actual.docsRoot, expectation.docsRoot);
    });

    it("Should generate sidebar diff by adding new empty element", async function() {
            mockSidebarFS(createSidebarContent());
            await diffManager.generateSidebarDiff(path.join(process.cwd(), 'website'));
            let expectation = createSidebarContent();
            expectation.toBeDeleted = {};
            let actual = readSidebarFile();
            assert.deepEqual(actual, expectation);
    });

    it("Should clean up diff by removing HTML comment", async function() {
        mockFileSystem(createFileContentWithDiff());
        await diffManager.cleanUpFileDiff(path.join(process.cwd(), 'docs'));
        let expectation = createFileContent();
        let actual = readFiles();
        assert.strictEqual(actual.apiOverview, expectation.apiOverview);
        assert.strictEqual(actual.apiPostCart, expectation.apiPostCart);
        assert.strictEqual(actual.docsRoot, expectation.docsRoot);
    });

    it ("Should clean up diff from sidebar", async function() {
        let sidebarContent = createSidebarContent();
        sidebarContent.toBeDeleted = {};
        mockSidebarFS(sidebarContent);
        await diffManager.cleanUpSidebarDiff(path.join(process.cwd(), 
            "website"));
        assert.deepEqual(readSidebarFile(), createSidebarContent());
    });

    it("Should clean up diff from versioned docs by removing HTML comment", async function() {
            mockVersionDocsFileSystem(createFileContentWithDiff());
            await diffManager.cleanUpFileDiff(path.join(process.cwd(), 'versioned_docs'), "0.0.3");
            let expectation = createFileContent();
            let actual = readVersionedFiles();
            assert.strictEqual(actual.apiOverview, expectation.apiOverview);
            assert.strictEqual(actual.apiPostCart, expectation.apiPostCart);
            assert.strictEqual(actual.docsRoot, expectation.docsRoot);
    });

    it("Should clean up sidebar diff from versioned docs", async function() {
        let sidebarContent = createVersionedSidebarContent();
        sidebarContent["version-1.0.2-toBeDeleted"] = {};
        mockVersionedSidebarFS(sidebarContent);
        await diffManager.cleanUpSidebarDiff(path.join(process.cwd(), "website"), "1.0.2");
        assert.deepEqual(readVersionedSidebarFile(), createVersionedSidebarContent()); 
    })

    function createFileContent() {

        return {
            'apiOverview': "This is an overview for the api",
            'apiPostCart': "This endpoint will create a new cart",
            'docsRoot': "Welcome to the documentation for EP Commerce"
        };
    }

    function createFileContentWithDiff() {
        return {
            'apiOverview': "This is an overview for the api" + DIFFHTMLCOMMENT,
            'apiPostCart': "This endpoint will create a new cart" + DIFFHTMLCOMMENT,
            'docsRoot': "Welcome to the documentation for EP Commerce" + DIFFHTMLCOMMENT
        };
    }
    
    function createSidebarContent() {
        return {
            "API": {
                "Overview": [
                    "index",
                    "Endpoints"
                ] 
            }
        }
    }

    function createVersionedSidebarContent() {
        return {
            "version-1.0.2-API": {
                "Overview": [
                    "version-1.0.2-index",
                    "version-1.0.2-Endpoints"
                ]
            }
        }
    }

    function mockFileSystem(filesToMock) {
        mockfs({
            'docs': {
                "API": {
                    'apiOverview.md': filesToMock.apiOverview,
                    'Endpoints': {
                        'postCart.md': filesToMock.apiPostCart
                    }
                },
                'docsOverview.md': filesToMock.docsRoot
            } 
        })
    }

    function mockSidebarFS(sidebarJSON) {
        mockfs({
            'website': {
                "sidebars.json": JSON.stringify(sidebarJSON)
            }
        })
    }

    function mockVersionedSidebarFS(sidebarJSON) {
        mockfs({
            'website': {
                'versioned_sidebars': {
                    "version-1.0.2-sidebars.json": JSON.stringify(sidebarJSON)
                }
            }
        })
    }

    function readSidebarFile() {
        let sidebarRawContent = fs.readFileSync(path.join(process.cwd(), "website", "sidebars.json"), 'utf8');
        return JSON.parse(sidebarRawContent);
    }

    function readVersionedSidebarFile() {
        let sidebarRawContent = fs.readFileSync(path.join(process.cwd(), "website", "versioned_sidebars", "version-1.0.2-sidebars.json"), 'utf8');
        return JSON.parse(sidebarRawContent);
    }

    function readFiles() {
        let filePaths = {
            'apiOverview': path.join(process.cwd(), 'docs', 'API', 'apiOverview.md'),
            'apiPostCart': path.join(process.cwd(), 'docs', 'API', 'Endpoints', 'postCart.md'),
            'docsRoot': path.join(process.cwd(), 'docs', 'docsOverview.md')
        }
        return {
            'apiOverview': fs.readFileSync(filePaths.apiOverview,'utf8'),
            'apiPostCart': fs.readFileSync(filePaths.apiPostCart, 'utf8'),
            'docsRoot': fs.readFileSync(filePaths.docsRoot, 'utf8')
        };
    }

    function readVersionedFiles() {
        let filePaths = {
            'apiOverview': path.join(process.cwd(), 'versioned_docs', 'version-0.0.3', 'API', 'apiOverview.md'),
            'apiPostCart': path.join(process.cwd(), 'versioned_docs', 'version-0.0.3', 'API', 'Endpoints', 'postCart.md'),
            'docsRoot': path.join(process.cwd(), 'versioned_docs', 'version-0.0.3', 'docsOverview.md')
        }
        return {
            'apiOverview': fs.readFileSync(filePaths.apiOverview,'utf8'),
            'apiPostCart': fs.readFileSync(filePaths.apiPostCart, 'utf8'),
            'docsRoot': fs.readFileSync(filePaths.docsRoot, 'utf8')
        };
    }

    function mockVersionDocsFileSystem(filesToMock) {
        mockfs({
            'versioned_docs': {
                "version-0.0.3": {
                    "API": {
                        'apiOverview.md': filesToMock.apiOverview,
                        'Endpoints': {
                            'postCart.md': filesToMock.apiPostCart
                        }
                    },
                    'docsOverview.md': filesToMock.docsRoot
                }
            } 
        })
    }
})