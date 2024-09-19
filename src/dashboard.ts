import { DashboardUI, DashboardMenu, DashboardMenuItem } from './lib/DashboardUI';
import { getFolders } from './lib/project/getFolders';
import { getProjectMeta } from './lib/project/getProjectMeta';
import { isProject } from './lib/project/isProject';
import ProjectPackage from './lib/project/ProjectPackage';
import { isProjectReady } from './lib/project/isProjectReady';
import { createProject } from './lib/project/createProject';
import { ProjectMeta } from './lib/project/ProjectMeta';

type MenuKeys = 'project' | 'projectDiscovery' | 'projectReady' | 'projectSearch';

function DashboardManager() {
    let dashboard: DashboardUI;
    let menus: Record<MenuKeys, DashboardMenu>
    const currentDirectory = process.cwd();

    const switchMenu = (m: DashboardMenu | undefined = determineMenu()) => {
        if (!dashboard || !menus || !m) {
            return false;
        }
        dashboard.updateMenu(m)
        return true;
    }

    const prompt = async (prompt: string, initialValue?: string): Promise<string | undefined> => {
        if (!dashboard) {
            return;
        }
        return await dashboard.promptText(prompt, initialValue);
    }

    const promptSelection = async (prompt: string, options: { value: string; label: string; }[], isMulti: boolean = false): Promise<string[] | undefined> => {
        if (!dashboard) {
            return;
        }
        return await dashboard.promptSelect(prompt, options, isMulti);
    }

    //--

    const addFile = (mi: DashboardMenuItem) => {
        // List out project structure with interactive list, (no files), moving with arrows, enter to select dir
        //      ask the user for a filename
        // show edit file menu
        return false;
    }

    const editFile = (mi: DashboardMenuItem) => {
        // List out project structure with interactive list, moving with arrows, enter to select file
        // show file meta
        return false;
    }

    const deleteFile = (mi: DashboardMenuItem) => {
        // List out project structure with interactive list, moving with arrows, enter to select file
        //      can use files.json to highlight details about file selected for deletion
        //      list out any references in other files (ts-morph potentially)
        //          references will need to be updated first, blocks deletion.
        //      ask user to confirm
        // delete file at path
        // show project menu
        switchMenu(menus.project);
        return false;
    }

    const deleteDir = (mi: DashboardMenuItem) => {
        // List out project structure with interactive list, (no files), moving with arrows, enter to select dir
        //      if dir has files, list out files indicating you can't delete until files have been.
        //          indicate a count for file references 
        // show project menu
        switchMenu(menus.project);
        return false;
    }

    const reviewProject = (mi: DashboardMenuItem) => {
        // iterate through each dir, comparing files.json to project dir and files
        //      add missing dirs to files.json
        //      new or modified files will need AI to review the file and provide updates to files.json
        // show project menu
        switchMenu(menus.project);
        return false;
    }

    const changeDeclarations = (mi: DashboardMenuItem) => {
        // List out declarations
        //      ask user what declarations they would like to modify (multi-select)
        //          List of features linked in file meta related to declarations
        //          Ask the user what feature the change should relate to (multi-select)
        //              there should be an option to define a new feature, 
        //                  which will refresh the list for select again
        //      prompt the user to describe the changes they would like
        //          AI to update related tests for file
        //              AI uses file meta + user prompt
        //              User to validate test changes
        //          AI to update file based on user prompt
        //              AI uses file meta + user prompt + updated test
        //              AI iterates until test passes
        //          Update file meta
        //          Update file history
        // Show edit file menu
        return false;
    }

    const addToFile = (mi: DashboardMenuItem) => {
        // Ask the user what feature this relates to (multi-select)
        //      there should be an option to define a new feature, 
        //          which will refresh the list for select again.
        // Prompt the user to describe the changes they would like to add
        //      AI to update related tests for file
        //          AI uses file meta + user prompt
        //          User to validate test changes
        //      AI to update file based on user prompt
        //          AI uses file meta + user prompt + updated test
        //          AI iterates until test passes
        //      Update file meta
        //      Update file history
        // Show edit file menu
        return false;
    }

    const projectMenu: DashboardMenu = {
        title: 'Project Menu',
        items: [
            { id: 'reviewProject', label: 'Review Gaps', callback: reviewProject }, // if there are files without meta
            { id: 'addFile', label: 'Add File', callback: addFile },
            {
                id: 'editFile', label: 'Edit File', callback: editFile, childItems: [
                    { id: 'changeDeclarations', label: 'Change File Declarations', callback: changeDeclarations },
                    { id: 'addToFile', label: 'Add to file', callback: addToFile },
                ]
            },
            { id: 'deleteFile', label: 'Delete File', callback: deleteFile },
            { id: 'deleteDir', label: 'Delete Directory', callback: deleteDir },
        ]
    };

    //--

    const discoverProject = (mi: DashboardMenuItem) => {
        // create ./.project/meta.json (based on package.json)
        // create ./.project/history.json
        // create ./.project/files.json
        // iterate through each dir, updating files.json and getting AI to review each file to supply a summary.
        // once files.json has been updated, gather a list of possible features
        //      update meta.json and files.json with features and featureImpact.
        // switch to project menu
        switchMenu();
        return false;
    }

    const projectDiscoveryMenu: DashboardMenu = {
        title: 'Project Discovery Menu',
        items: [
            { id: 'discoverProject', label: 'Discover Project', callback: discoverProject },
        ]
    }

    //--

    const createProjectFiles = async (mi: DashboardMenuItem) => {
        const name = await prompt('What is the name of your project?');
        const description = await prompt('Provide a brief description of your project:');
        const version = await prompt('What is the initial version of your project?', '1.0.0');
        const tests = await promptSelection('Where will your tests be located?', [
            { value: 'colocatedFile', label: 'Co-located with the file they test (e.g., myComponent.test.ts)' },
            { value: 'colocatedDir', label: 'In a directory next to the file they test (e.g., __tests__/myComponent.test.ts)' },
            { value: 'rootDir', label: 'In a root test directory (e.g., /tests/myComponent.test.ts)' },
        ]) as ProjectMeta['tests'][];

        const features = await prompt('List out the features of your project (comma separated):');

        if (name && description && version && tests?.length > 0) {
            createProject({
                name,
                description,
                version,
                tests: tests[0],
                features: features ? features.split(',') : [],
            });
        }

        switchMenu();
        return false;
    }

    const projectReadyMenu: DashboardMenu = {
        title: 'New Project Menu',
        items: [
            { id: 'createProject', label: 'Create Project', callback: createProjectFiles },
        ]
    }

    //--

    const findProject = (mi: DashboardMenuItem) => {
        // search directories four levels deep, looking for .project/meta.json
        //      stop search levels if a project, discoverable project or project ready dir is found.
        // list out paths as number list for each of the 3 dir types
        // if project, list out details of project.
        // if project discoverable, list out package details.
        // if project ready, indicate empty dir and name of dir.
        // display a pick list menu asking user to pick number associated to discovered dirs,
        //      then change to that dir and update menu to relative menu.
        switchMenu();
        return false;
    }

    const changeDirectory = (mi: DashboardMenuItem) => {
        // list out current directories (similar to ls)
        // let use pick dir to change to, and display menu relative to dir contents
        return false;
    }

    const projectSearchMenu: DashboardMenu = {
        title: 'Project Search Menu',
        items: [
            { id: 'findProject', label: 'Find Project', callback: findProject },
            { id: 'changeDir', label: 'Change Directory', callback: changeDirectory },
        ]
    }

    //--

    menus = {
        project: projectMenu,
        projectDiscovery: projectDiscoveryMenu,
        projectReady: projectReadyMenu,
        projectSearch: projectSearchMenu,
    }

    const determineMenu = () => {
        //  check if the current directory is a project
        if (isProject(currentDirectory)) {
            const projectMeta = getProjectMeta(currentDirectory);
            if (projectMeta) {
                return menus.project;
            }
        }
        else if (ProjectPackage.has(currentDirectory)) {
            const projectPackage = ProjectPackage.get(currentDirectory);
            return menus.projectDiscovery;
        }
        else if (isProjectReady(currentDirectory)) {
            return menus.projectReady;
        }
        else {
            const folders = getFolders(currentDirectory);
            if (folders.length > 0) {
                return menus.projectSearch;
            }
        }
        return;
    }

    const initialize = () => {
        let dashboardMenu: DashboardMenu | undefined = determineMenu();

        if (!dashboard) {
            dashboard = new DashboardUI('AI Projects', {
                screen: {
                    smartCSR: true
                },
                menu: dashboardMenu,
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