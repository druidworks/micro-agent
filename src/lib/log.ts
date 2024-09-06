import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export function log(...args: any[]) {
    const path = `${__dirname}/project.log`;
    let existingLog = '';
    if (existsSync(path)) {
        existingLog = readFileSync(path, { encoding: 'utf-8' });
    }
    existingLog += args.join(' ') + '\n';
    writeFileSync(path, existingLog);
}