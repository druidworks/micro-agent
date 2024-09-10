import { readFileSync } from 'node:fs';

import { log } from '../log';

import { getProjectMetaPath } from './getProjectMetaPath';
import { ProjectMeta } from "./ProjectMeta";

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