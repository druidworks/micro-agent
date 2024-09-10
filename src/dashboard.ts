import { DashboardUI, DashboardMenuItem } from './lib/DashboardUI';
import { getFolders } from './lib/project/getFolders';
import { getProjectMeta } from './lib/project/getProjectMeta';
import { isProject } from './lib/project/isProject';
import ProjectPackage from './lib/project/ProjectPackage';
import { isProjectReady } from './lib/project/isProjectReady';

// TODO: refresh dashboard menu via callbacks

function DashboardManager() {
    let dashboard: DashboardUI;
    const currentDirectory = process.cwd();

    const addFile = (mi: DashboardMenuItem) => {
        return false;
    }

    const deleteFile = (mi: DashboardMenuItem) => {
        return false;
    }

    const reviewProject = (mi: DashboardMenuItem) => {
        return false;
    }

    const discoverProject = (mi: DashboardMenuItem) => {
        return false;
    }

    const createProject = (mi: DashboardMenuItem) => {
        return false;
    }

    const findProject = (mi: DashboardMenuItem) => {
        return false;
    }

    const changeDirectory = (mi: DashboardMenuItem) => {
        return false;
    }

    const menus = {
        project: [
            { id: 'reviewProject', label: 'Review Gaps', callback: reviewProject }, // if there are files without meta
            { id: 'addFile', label: 'Add File', callback: addFile },
            { id: 'deleteFile', label: 'Delete File', callback: deleteFile },
        ],
        projectDiscovery: [
            { id: 'discoverProject', label: 'Discover Project', callback: discoverProject },
        ],
        projectReady: [
            { id: 'createProject', label: 'Create Project', callback: createProject },
        ],
        projectSearch: [
            { id: 'findProject', label: 'Find Project', callback: findProject },
            { id: 'changeDir', label: 'Change Directory', callback: changeDirectory },
        ]
    }

    const initialize = () => {
        let dashboardMenuItems: DashboardMenuItem[] = [];

        //  check if the current directory is a project
        if (isProject(currentDirectory)) {
            const projectMeta = getProjectMeta(currentDirectory);
            if (projectMeta) {
                dashboardMenuItems = menus.project;
            }
        }
        else if (ProjectPackage.has(currentDirectory)) {
            const projectPackage = ProjectPackage.get(currentDirectory);
            dashboardMenuItems = menus.projectDiscovery;
        }
        else if (isProjectReady(currentDirectory)) {
            dashboardMenuItems = menus.projectReady;
        }
        else {
            const folders = getFolders(currentDirectory);
            if (folders.length > 0) {

                dashboardMenuItems = menus.projectSearch;
            }
        }

        if (!dashboard) {
            dashboard = new DashboardUI('AI Projects', {
                screen: {
                    smartCSR: true
                },
                menu: {
                    title: 'Actions',
                    items: dashboardMenuItems
                }
            });
        
            dashboard.render();
        } else {
            dashboard.render();
        }
    }

    return {
        setup: initialize
    }
}

const dm = DashboardManager();
dm.setup();