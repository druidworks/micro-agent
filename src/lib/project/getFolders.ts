import { readdirSync, lstatSync } from 'node:fs';

import { isProject } from './isProject';
import { getProjectMeta } from './getProjectMeta';
import { ProjectMeta } from './ProjectMeta';

export const getFolders = (path: string) => readdirSync(path).reduce((folders: { filename: string; path: string; projectMeta?: ProjectMeta }[], item: string) => {
    const stats = lstatSync(`${path}/${item}`);
    if (stats.isDirectory()) {
        const dirPath = `${path}/${item}`;
        let projectMeta;
        if (isProject(dirPath)) {
            projectMeta = getProjectMeta(dirPath);
        }
        folders.push({
            filename: item,
            path: dirPath,
            projectMeta,
        });
    }
    return folders;
}, []);