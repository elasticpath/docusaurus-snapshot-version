## Description  
This module provides a better way to version documentation websites managed by [Docusaurus](https://docusaurus.io/).  
It wraps the native docusaurus version command to enable snapshot style versioning of documentation. It does this task without leaving any trace of its existence in any of the documentation or configuration files.  
## Usage
This module can be installed using `yarn add git@github.elasticpath.net:ppatel/docusaurus-snapshotVersion.git`.  
It only has a single command for versioning as follows  
`./node_modules/.bin/docusaurus-snapshotVersion create <version> [siteDir]`  
where `<version>` is mandatory argument that is the new version user wishes to create  
`[siteDir]` is an optional argument that can be absolute or relative path to the `website` directory of docusaurus project