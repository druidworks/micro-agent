export type ProjectHistory = ProjectHistoryItem[];

export interface ProjectHistoryItem {
    date: string;
    versionImpact: 'major' | 'minor' | 'patch';
    versionApplied: boolean;
    filepath: string;
    changeSummary: string;
}