const fs = require('fs');
const mockfs = require('mock-fs');
const assert = require('chai').assert;
const assetCopier = require('../../src/lib/assetCopier.js');
const path = require("path");

describe("Copy assets for versioning", function() {

    it("Should copy assets docs/assets to docs/assets/version for given version", async function() {
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
            }
        });

        let docsDir = path.join(process.cwd(), "docs");
        await assetCopier.copyDocAssets(docsDir, "1.2.4");
        let versionedAssetPath = path.join(docsDir, "assets", "version-1.2.4");
        let versionedOverviewPath = path.join(versionedAssetPath, "Overview.png");
        let versionedAPIPath = path.join(versionedAssetPath, "API");

        assert.isTrue(fs.existsSync(versionedAssetPath));
        assert.isTrue(fs.existsSync(versionedOverviewPath));
        assert.isFalse(fs.existsSync(versionedAPIPath));
        let versionedOverviewBuffer = fs.readFileSync(versionedOverviewPath);
        assert.isTrue(overviewBuffer.equals(versionedOverviewBuffer));
        mockfs.restore();
    });

})