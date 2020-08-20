## DocusaurusV1-SnapshotVersion

Elastic Path uses [Docusaurus - V1](https://docusaurus.io/) for generating documentation site. It's a great tool and has been useful in delivering our documentation easily and quickly. It also has out-of-the box versioning feature, which is needed for any software project documentation.

## Concepts

### Why was this tool created?

Docusaurus provides feature for managing versions. It uses [Fallback functinoality](https://docusaurus.io/docs/en/versioning#fallback-functionality) when creating new versions of docs. The concept/architecture of “new version” in Docusaurus - V1 has some issues/limitations that makes it very difficult to maintain a documentation site that is constantly changing across different versions.

**Assets are not being versioned** - Every documentation will have images. Docusaurus does not provide any guidance, conventions, or feature for managing these static assets. There isn't any straight-forward way of managing images used in different versions of docs.

**Fallback based versioning is not practical** - This concept creates a new copy of documents, if and only if, the contents has changed from previous version. Because of this, following issues appear:

When a new version is created, `doc1.md` may not have had any changes compared to the previuos version. So, `doc1.md` will not be created for the new version but will be generated from previous version as a page when the site is built. But after the version is created, how do we make changes to `doc1.md` in that new version since there isn't any source copy generated for this doc when version was created?

How do we update an older version without it directly affecting the newer version? For example, there are 2 versions named `1.0.0` and `2.0.0`. Due to Fallback functionality `doc1.md` is not created in `2.0.0` when this version was created because there were no changes at the time. But, if `doc1.md` needs a change that doesn't apply to `2.0.0`, how to we make that change without impacting `2.0.0`?

### How does this tool work?

This tool was created to solve the problems mentioned above. It provides a new command, `docusaurus-snapshotVersion`, for creating new version. It's a wrapper for the built-in command Docusaurus uses to create new versions.

The command uses a convention for managing static static assets. Expectation is that:

- All static assets for "next release" will be at the root of `docs/assets/` directory as a flat hierarchy (i.e. no sub-directory).
- All static assets for "versioned docs" will be at the root of `docs/assets/versioned-docs/` directory as a flat hierarcy (i.e. no sub-directory).

    Ideally, the versioned assets would reside with versioned documents (i.e. `website/versioned-docs/assets/`). But this cannot be achieved without changing core logic of Docusaurus V1.

The `docusaurus-snapshotVersion` command works in following way when it is executed:

1. Add a dummy line to the end of **all** documents (only files with `.md` extension) in “next release” docs.
2. Add a dummy line to the end of sidebar configuration file for “next release” docs.
3. Execute the command (`docusaurus-version`) from Docusaurus for creating a new version.

    Because all documents and sidebar configuration of "next release" docs have a change, Docusaurus will copy all documents from "next release" docs to "new version" as well as create a new copy of the sidebar configuration for that version.

4. Undo the dummy changes made in step 1 & 2 for both "next reelease" and "new version" docs.

5. Copy all files in `docs/assets/` (without any sub-directories) directory into `docs/assets/<new-version>/` directory

6. In the “new version” update all documents containing image references to point to the new asset directory created in previous step.

## Usage

1. Add/install this module in your project:

  - Yarn: `yarn add https://github.elasticpath.net/ppatel/docusaurus-snapshotVersion.git --dev`
  - Npm: `npm install https://github.elasticpath.net/ppatel/docusaurus-snapshotVersion.git --save-dev`


2. Run the following command to create a new version from "next release" docs.

    ```sh
    $ ./node_modules/.bin/docusaurus-snapshotVersion create <version> [siteDir]
    ```

    - `<version>` is mandatory, which should be the value of the new version being created (i.e. `1.1.x`, `2.0.0`, etc.).

    - `[siteDir]` is optional. It can be absolute or relative path to the `website` directory of Docusaurus V1 project.

