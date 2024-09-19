import { writeFileSync } from 'node:fs';
import { ProjectMeta } from './ProjectMeta';

/**
 *  Creates a new project with the following steps within the current workding directory:
 *
 *  * **Creates `./package.json`**:
 *      * Sets `"name"`,
 *      * Sets `"description"`,
 *      * Sets `"version"`,
 *      * Sets `"module": true`.
 *  * **Creates project metadata files:**
 *      * `.project/meta.json`
 *          * `"name"`,
 *          * `"description"`,
 *          * `"version"`,
 *          * `"features"`,
 *          * `"tests"`: 'colocatedFile' | 'colocatedDir' | 'rootDir';
 *      * `.project/history.json`
 *      * `.project/files.json`
 * 
 * @returns {void} 
 */
export function createProject(meta: ProjectMeta) {
    writeFileSync('./package.json', JSON.stringify({
        name: meta.name,
        description: meta.description,
        version: meta.version,
        module: true,
        scripts: [{ test: "jest" }]
    }, null, 2));

    writeFileSync('./.project/meta.json', JSON.stringify(meta, null, 2));
    writeFileSync('./.project/history.json', JSON.stringify([], null, 2));
    writeFileSync('./.project/files.json', JSON.stringify([], null, 2));
}