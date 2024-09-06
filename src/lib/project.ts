import { existsSync, readFileSync, readdirSync, lstatSync, read } from 'node:fs';
import { log } from './log';
import { isValidProject } from '../helpers/validate-project';

export interface ProjectMeta {
    name: string;
    description: string;
    features: string[];
}

export const getProjectMetaPath = (path: string) => `${path}/.project/meta.json`;
export const isProject = (path: string) => existsSync(getProjectMetaPath(path));
export const getProjectMeta = (path: string): ProjectMeta | undefined => {
    const content = readFileSync(getProjectMetaPath(path), 'utf-8');
    try {
        return JSON.parse(content);
    } catch (e) {
        if (e instanceof Error) {
            log(e.message, e.stack);
        }
    }
    return;
};
export const isProjectDiscoverable = (path: string) => {
    return !isProject(path) && isValidProject();
}
export const isProjectReady = (path: string) => {
    return readdirSync(path).length === 0;
}
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
