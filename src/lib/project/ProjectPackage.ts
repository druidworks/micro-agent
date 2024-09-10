import { getDependencyFile } from '../../helpers/dependency-files';

import { isProject } from "./isProject";

function ProjectPackage() {
    const packageByPath: Record<string, string | undefined | null> = {};

    const get = (path: string) => {
        if (!packageByPath[path]) {
            packageByPath[path] = getDependencyFile(path);
        }
        return packageByPath[path];
    }

    return {
        get,
        has: (path: string) => {
            const packageContent = get(path);
            return !isProject(path) && packageContent !== null && packageContent !== undefined;
        }
    }
}

export default ProjectPackage();