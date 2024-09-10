import { readdirSync } from 'node:fs';

export const isProjectReady = (path: string) => {
    return readdirSync(path).length === 0;
}