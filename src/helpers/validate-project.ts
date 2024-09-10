import { getDependencyFile } from './dependency-files';

export function isValidProject(): boolean {
  const fileContent = getDependencyFile();
  return fileContent !== null;
}
