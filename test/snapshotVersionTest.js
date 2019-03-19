const sinon = require('sinon');
const createVersion = require('../src/lib/createVersion.js');
const snapshotVersion = require('../src/snapshotVersion.js');

describe("The command parsing should parse create command properly", function(){

    it("Should call createVersion when the correct command is passed", 
        function() {
            sinon.stub(createVersion);
            snapshotVersion(["","","create", "1.0.0", "./abc/def"]);
            sinon.assert.calledOnce(createVersion.create);
            sinon.assert.calledWithExactly(createVersion.create, "1.0.0", "./abc/def");
            sinon.restore();
    })
});