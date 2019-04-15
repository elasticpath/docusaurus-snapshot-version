const mockfs = require('mock-fs');
const assert = require('chai').assert;
const path = require('path');
const fs = require('fs');
const linker = require('../../src/lib/linker.js');

describe("Link versioned assets in versioned docs", function() {

    afterEach(function() {
        mockfs.restore();
    })

    it("Should replace asset and markdown links in versioned docs", 
        async function() {
            mockUnlinkedMarkdownFiles();
            await linker.linkAssetsAndMarkdownFiles(path.join(process.cwd(), "versioned_docs"), "1.4.5");
            let expectation = createLinkedMarkdownContent();
            let actual = readLinkedMarkdownFiles();
            assert.strictEqual(actual.docsOverview, expectation.docsOverview);
            assert.strictEqual(actual.apiOverview, expectation.apiOverview);
            assert.strictEqual(actual.apiPostCart, expectation.apiPostCart);
    });

    it("Should not write to a file when it does not have links", 
        async function() {
        mockfs({
            "versioned_docs": {
                "version-1.4.5": {
                    "Overview.md": "This file do not have assets or links to other markdown files"
                }
            }
        })
        let versionedDocsDir = path.join(process.cwd(), "versioned_docs");
        await linker.linkAssetsAndMarkdownFiles(versionedDocsDir, "1.4.5");
        let expectation = "This file do not have assets or links to other markdown files";
        let actual = fs.readFileSync(path.join(versionedDocsDir, "version-1.4.5", "Overview.md"), 'utf8');
        assert.strictEqual(actual, expectation);
    });
    
    it("Should not modify non markdown files", async function() {
        mockfs({
            "versioned_docs": {
                "version-1.4.5": {
                    "Overview.txt": "This file is not markdown ![Do not replace](doNotReplace.jpeg) [anotherMDLink](another.md)"
                }
            }
        })
        let versionedDocsDir = path.join(process.cwd(), "versioned_docs");
        await linker.linkAssetsAndMarkdownFiles(versionedDocsDir, "1.4.5");
        let expectation = "This file is not markdown ![Do not replace](doNotReplace.jpeg) [anotherMDLink](another.md)";
        let actual = fs.readFileSync(path.join(versionedDocsDir, "version-1.4.5", "Overview.txt"), 'utf8');
        assert.strictEqual(actual, expectation);
    });

    function createUnlinkedMarkdownContent() {
        return {
            "apiOverview": "This is an overview for page ![Overview of API](assets/overview.png). This is a link to another doc [another](abc.md)",
            "apiPostCart": "Cart can either be posted as ![post one cart](assets/postone.jpeg) or as ![post multiple carts](assets/postMultiple.gif). For details please refer to [postDetails](../postDetails.md).",
            "docsOverview": "The following text is garbage just to test regex: abcd!![def](/feg.png) !(no a link) !![replace1](assets/replaceThis.BC) ![not replace][do not replace](assets/doNotReplace.jpeg) ![[MyImage]](assets/donotReplace.jpeg). [[Do not replace]](doNotReplace.md) [Replace content section](abc.md#section2) [Replace content](../abcd.md#def) [ReplaceContent](./abc.md)"
        }
    }

    function createLinkedMarkdownContent() {
        return {
            "apiOverview": "This is an overview for page ![Overview of API](assets/version-1.4.5/overview.png). This is a link to another doc [another](abc.html)",
            "apiPostCart": "Cart can either be posted as ![post one cart](assets/version-1.4.5/postone.jpeg) or as ![post multiple carts](assets/version-1.4.5/postMultiple.gif). For details please refer to [postDetails](../postDetails.html).",
            "docsOverview": "The following text is garbage just to test regex: abcd!![def](/feg.png) !(no a link) !![replace1](assets/version-1.4.5/replaceThis.BC) ![not replace][do not replace](assets/doNotReplace.jpeg) ![[MyImage]](assets/donotReplace.jpeg). [[Do not replace]](doNotReplace.md) [Replace content section](abc.html#section2) [Replace content](../abcd.html#def) [ReplaceContent](./abc.html)"
        } 
    }

    function readLinkedMarkdownFiles() {
        let filePaths = {
            'apiOverview': path.join(process.cwd(), 'versioned_docs', 'version-1.4.5', 'API', 'apiOverview.md'),
            'apiPostCart': path.join(process.cwd(), 'versioned_docs', 'version-1.4.5', 'API', 'Endpoints', 'postCart.md'),
            'docsOverview': path.join(process.cwd(), 'versioned_docs', 'version-1.4.5', 'docsOverview.md')
        }
        return {
            'apiOverview': fs.readFileSync(filePaths.apiOverview,'utf8'),
            'apiPostCart': fs.readFileSync(filePaths.apiPostCart, 'utf8'),
            'docsOverview': fs.readFileSync(filePaths.docsOverview, 'utf8')
        };
    }

    function mockUnlinkedMarkdownFiles() {
        let files = createUnlinkedMarkdownContent();
        mockfs({
            "versioned_docs": {
                "version-1.4.5": {
                    "API": {
                        'apiOverview.md': files.apiOverview,
                        'Endpoints': {
                            'postCart.md': files.apiPostCart
                        }
                    },
                    'docsOverview.md': files.docsOverview
                }
            }
        })
    }
})