export interface ProjectMeta {
    name: string;
    description: string;
    version: string;
    features: string[];
    tests: 'colocatedFile' | 'colocatedDir' | 'rootDir';
}