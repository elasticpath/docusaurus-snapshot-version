const mockfs = require('mock-fs');
const assert = require('chai').assert;
const assetCopier = require('../../src/lib/assetCopier.js');
const fs = require('fs');
const path = require("path");

describe("Copy assets for versioning", function() {
    it("Should copy assets from docsDir to versionedDocsDir for given version", async function() {
        let overviewBuffer = Buffer.from("This is an overview text", "binary");
        let endpointListBuffer = Buffer.from("This is a list of endpoints", "binary");
        mockfs({
            "docs": {
                "assets": {
                    "Overview.png": overviewBuffer,
                    "API": {
                        "endpointList.jpeg": endpointListBuffer
                    }
                }
            },
            "website": {
                "versioned_docs": {
                    "version-1.2.4":{}
                }
            }
        })
        let docsDir = path.join(process.cwd(), "docs");
        let versionedDocsDir = path.join(process.cwd(), "website", "versioned_docs");

        await assetCopier.copyAssets(docsDir, versionedDocsDir, "1.2.4");

        let versionedAssetPath = path.join(versionedDocsDir, "version-1.2.4", "assets");
        let overviewPath = path.join(versionedAssetPath, "Overview.png");
        let APIPath = path.join(versionedAssetPath, "API");
        let endpointListPath = path.join(APIPath, "endpointList.jpeg");

        assert.isTrue(fs.existsSync(versionedAssetPath));
        assert.isTrue(fs.existsSync(overviewPath));
        assert.isTrue(fs.existsSync(APIPath));
        assert.isTrue(fs.existsSync(endpointListPath));
        let versionedOverviewBuffer = fs.readFileSync(overviewPath);
        let versionedEndpointListBuffer = fs.readFileSync(endpointListPath);
        assert.isTrue(overviewBuffer.equals(versionedOverviewBuffer));
        assert.isTrue(endpointListBuffer.equals(versionedEndpointListBuffer));
    });
})