import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

/**
 * Find dependency file in the given directory or any
 * parent directory. Returns the content of the dependency file.
 */
export function getDependencyFile(
  directory = process.cwd(),
  language?: string
): string | null {
  let currentDirectory = directory;
  while (currentDirectory !== '/') {
    if (language) {
      const filePath = getDependenciesFilePath(directory, language);

      if (existsSync(filePath)) {
        return getDependenciesFileContent(directory, language);
      }
    } else {
      let filePath = getDependenciesFilePath(directory, 'py');
      if (existsSync(filePath)) {
        return getDependenciesFileContent(directory, 'py');
      }
      filePath = getDependenciesFilePath(directory, 'rb');
      if (existsSync(filePath)) {
        return getDependenciesFileContent(directory, 'rb');
      }
      filePath = getDependenciesFilePath(directory, 'js');
      if (existsSync(filePath)) {
        return getDependenciesFileContent(directory, 'js');
      }
    }
    currentDirectory = path.dirname(currentDirectory);
  }
  return null;
}

export function getDependencyFileName(language?: string): string {
  let fileName;
  switch (language) {
    case 'py':
      fileName = 'requirements.txt';
      break;
    case 'rb':
      fileName = 'Gemfile';
      break;
    default:
      fileName = 'package.json';
      break;
  }
  return fileName;
}

function getDependenciesFilePath(directory: string, language?: string): string {
  const fileName = getDependencyFileName(language);
  return path.join(directory, fileName);
}

function getDependenciesFileContent(
  directory = process.cwd(),
  language?: string
): string {
  const filePath = getDependenciesFilePath(directory, language);
  const fileContent = readFileSync(filePath, { encoding: 'utf8' });
  return fileContent;
}
