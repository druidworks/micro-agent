import { existsSync } from 'node:fs';

import { getProjectMetaPath } from './getProjectMetaPath';

export const isProject = (path: string) => existsSync(getProjectMetaPath(path));