## DocusaurusV1-SnapshotVersion

Elastic Path uses [Docusaurus - V1](https://docusaurus.io/) for generating documentation site. Docusaurus is a great tool that has been useful in delivering our documentation easily and quickly.

Docusaurus has a versioning feature, which is needed for any software project documentation. The Elastic Path DevOps team found that the versioning feature, which uses a fallback approach, was not sufficient and decided to implement a snapshot approach instead.

## Concepts

### Why was this tool created?

Docusaurus provides a feature for managing versions. It uses [Fallback functionality](https://docusaurus.io/docs/en/versioning#fallback-functionality) when creating new versions of docs. The concept/architecture of a “new version” in Docusaurus V1 has some issues and limitations that make it very difficult to maintain a documentation site that is constantly changing across different versions.

**Assets are not versioned** - Assets include images, which are a part of most documentation sites. Docusaurus does not provide any guidance, conventions, or features for managing assets. There isn't a straightforward way of managing images used in different versions of the documentation.

**Fallback-based versioning is not practical** - A new version of a file is created if and only if the file content has changed from the previous version. The following issues arise:

- When a new version is created, `doc1.md` may not have had any changes compared to the previous version. So, `doc1.md` is not created for the new version, but the `doc1.md` file is included when the new version of the documentation site is built. After the version is created, Docusaurus is not clear about how to make changes to `doc1.md` in the new version when the file wasn't copied to the new version.

- When a file needs a change that affects version `1.0.0` of the site, the change might not be suitable for version `2.0.0`. However, version `2.0.0` uses that file. Docusaurus is not clear about how to resolve this situation.

### How does this tool work?

This tool was created to solve the problems mentioned above. It provides a new command, `docusaurus-snapshot-version`, for creating new version. It's a wrapper for the built-in command Docusaurus uses to create new versions.

The command uses the following conventions for managing static assets:

#### Docs-Specific Static Assets

- All static assets for the "next release" are at the root of the `docs/assets/` directory as a flat structure, that is, there are no sub-directories.
- All static assets for "versioned docs" are at the root of the directory `docs/assets/version-<version-number>/` in a flat structure, that is, there are no sub-directories.

  Ideally, the versioned assets would reside with the versioned documents (i.e. `website/versioned_docs/version-<version-number>/assets/`), but this cannot be achieved without changing the core logic of Docusaurus V1.


#### Site-Specific Static Assets

- All static assets are at the root of the `website/static` directory. Once a static asset type is versioned, a `next` directory for the "next release" and a `<version-number>` directory for the versioned files are generated.

When you execute the `docusaurus-snapshot-version` command, the following steps are performed:

1. In the "next release" directory:

- Adds a new line to the end of all `*.md` files.
- Adds a new line to the end of the `website/sidebars.json` file

2. Creates a new version in the `website/versioned_docs/` directory by running the following command: `docusaurus-version`

   Because all the Markdown files and the `sidebars.json` file contain a change (the new line), Docusaurus copies all the files from the "next release" location to the "new version" location.


3. Removes the new lines that were added in step 1 for both the "next release" and the "new version".


4. Copies all the files from the `docs/assets/` directory (without any sub-directories) into the `docs/assets/version-<new-version>/` directory.


5. In the `website/versioned_docs/version-<version-number>/` directory, updates all the documents containing image references to point to the new assets directory created in the previous step.


6. If site-specific static asset types are included in the versioning, there are two scenarios:

    1. If the static asset type has never been versioned before, then a new `next` directory and a new `version-<version-number>` directory is created. If the static asset type has been versioned before, then only a new `version-<version-number>` directory is created. In the first case, everything from the static asset type directory is copied into the `next` directory. In both cases, everything from the `next` directory is copied into the `version-<version-number>` directory.
    2. Then the references to the static asset files in the `docs` directory and `versioned_docs` directory are updated accordingly.


## Usage

1. Add this module to your Docusaurus project:

- Yarn: `yarn add https://github.com/elasticpath/docusaurus-snapshot-version.git --dev`
- Npm: `npm install https://github.com/elasticpath/docusaurus-snapshot-version.git --save-dev`

> **Note**: At the moment, this tool is not published to npm registry. We can add a git repository as a dependency.


2. Run the following command to create a new version from "next release" docs.

    ```sh
    $ ./node_modules/.bin/docusaurus-snapshot-version create --version <version-number> --siteDir <siteDir> --staticDir <staticDir>
    ```

    - `version` - Required. The value of the new version to create, such as `1.1.x` or `2.0.0`.

    - `siteDir` - Optional. The absolute or relative path to the `website` directory of the Docusaurus V1 project. The default value is `.`.

    - `staticDir` Optional. The name of the static asset directory to be versioned under the website/static directory. The option can be repeated multiple times. The default value is an empty array.

