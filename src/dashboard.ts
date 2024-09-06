import { DashboardUI, DashboardMenuItem } from './lib/DashboardUI';
import { isProject, getProjectMeta, getFolders, isProjectDiscoverable, isProjectReady } from './lib/project';

const currentDirectory = process.cwd();

let dashboardMenuItems: DashboardMenuItem[] = [
    { id: 'One', label: 'Test One' },
    {
        id: 'Two', 
        label: 'Test Two', 
        title: 'Two Actions',
        childItems: [
            { id: 'Two.1', label: 'Test Two.1' },
            { id: 'Two.2', label: 'Test Two.2' },
        ]
    },
    { id: 'Three', label: 'Test Three' },
];

//  check if the current directory is a project
if (isProject(currentDirectory)) {
    const projectMeta = getProjectMeta(currentDirectory);
    if (projectMeta) {
        
    }
}
else if (isProjectDiscoverable(currentDirectory)) {

}
else if (isProjectReady(currentDirectory)) {

}
else {
    const folders = getFolders(currentDirectory);
    if (folders.length > 0) {
        
    }
}

createDashboard(dashboardMenuItems);

function createDashboard(items: DashboardMenuItem[]) {
    const mdash = new DashboardUI('Code House Agency', {
        screen: {
            smartCSR: true
        },
        menu: {
            title: 'Actions',
            items
        }
    });
    
    mdash.render();
}