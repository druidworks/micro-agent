export interface ProjectFiles {
    dirs: ProjectDir[];
    files: ProjectFile[];
}

export interface ProjectDir {
    type: 'dir';
    path: string;
    dirs: ProjectDir[];
    files: ProjectFile[];
}

export interface ProjectFile {
    type: 'file';
    path: string;
    description: string;
    featureImpact: string[];
}