import blessed from 'neo-blessed';
import { it } from 'node:test';

export interface DashboardMenuItem {
    id: string;
    label: string;
    title?: string;
    childItems?: DashboardMenuItem[];
}

export interface DashboardUIOptions {
    screen: blessed.Widgets.IScreenOptions;
    menu: {
        title: string;
        items: DashboardMenuItem[];
    }
}

const getCommonBoxStyle = (options?: {focusable?: boolean}) => {
    const {focusable = true} = options || {};
    const baseStyle: Record<string, any> = {
        border: {
            fg: 'white'
        }
    };
    if (focusable) {
        baseStyle.hover = {
            border: {
                fg: 'green'
            }
        };
        baseStyle.focus = {
            border: {
                fg: '#333333'
            }
        };
    }
    return baseStyle;
}

export class DashboardUI {
    private options: DashboardUIOptions;
    private screen: blessed.Widgets.Screen;
    private navigationBox: blessed.Widgets.BoxElement;
    private menuTitle: blessed.Widgets.TextElement;
    private menu: blessed.Widgets.ListElement;
    private displayBox: blessed.Widgets.BoxElement;
    private textbox: blessed.Widgets.TextboxElement;

    private tabFocusGroupIndex = 0;
    private tabFocusGroup: (blessed.Widgets.BoxElement | blessed.Widgets.TextboxElement)[] = [];

    private menuPath: string | undefined;
    private menuItemIndex = 0;
    private menuItems: DashboardMenuItem[];

    constructor(title: string, options: DashboardUIOptions) {
        this.options = options;
        this.screen = blessed.screen(options.screen);
        this.screen.title = title;

        this.menuItems = options.menu.items.slice();

        this.navigationBox = blessed.box({
            top: 0,
            left: 0,
            bottom: 3,
            width: 25,
            content: '',
            tags: true,
            border: {
                type: 'line'
            },
            style: getCommonBoxStyle(),
        });
        this.menuTitle = blessed.text({
            top: 0,
            left: 0,
            width: '100%',
            height: 1,
            content: 'Actions',
            style: {
                fg: 'white'
            }
        })
        this.menu = blessed.list({
            top: 2,
            left: 0,
            right: 0,
            bottom: 0,
            items: this.getMenuOptions(),
            style: {
                selected: {
                    fg: 'green'
                }
            }
        });
        this.displayBox = blessed.box({
            top: 0,
            left: 25,
            right: 0,
            bottom: 3,
            content: '',
            tags: true,
            focusable: false,
            border: {
                type: 'line'
            },
            style: getCommonBoxStyle({focusable: false})
        });
        this.textbox = blessed.textbox({
            bottom: 0,
            width: '100%',
            height: 3,
            border: {
                type: 'line'
            },
            style: getCommonBoxStyle(),
            inputOnFocus: true
        });
        this.tabFocusGroup = [
            this.navigationBox,
            this.textbox
        ];
        this.setupEvents();
    }

    public render() {
        this.setupLayout();
        this.screen.render();
        this.navigationBox.focus();
    }

    private setupEvents() {
        this.setupNavigationEvents();
        this.setupTextboxEvents();
        this.setupScreenEvents();
    }

    private setupScreenEvents() {
        this.screen.key(['tab'], this.tabFocus);
        this.screen.key(['escape', 'q', 'C-c'], (ch, key) => {
            return process.exit(0);
        });
    }

    private getChildMenuPath(childId: string) {
        return this.menuPath ? `${this.menuPath}.${childId}` : childId;
    }

    private getParentMenuPath(): string | undefined {
        if (!this.menuPath) {
            return undefined;
        }
        const pathSegments = this.menuPath.split('.');
        if (pathSegments.length === 1) {
            return undefined;
        }
        return pathSegments.slice(0, -1).join('.');
    }

    private getMenuOptions(path?: string): string[] | undefined {
        if (!path) {
            return this.menuItems.map(item => item.label);
        }
        const id = path.split('.').shift();
        const menuItem = this.menuItems.find((item) => item.id === id);
        if (menuItem?.childItems?.length) {
            return menuItem.childItems.map(item => item.label);
        }
    }

    private getMenu(path?: string): DashboardMenuItem | undefined {
        if (!path) {
            return { id: '', label: '', title: this.options.menu.title, childItems: this.menuItems };
        }
        const id = path.split('.').shift();
        const menuItem = this.menuItems.find((item) => item.id === id);
        if (menuItem) {
            return menuItem;
        }
    }

    private setupNavigationEvents() {
        this.setupMouseFocus(this.navigationBox);
        this.navigationBox.key(['up', 'down'], (ch, key) => {
            const currentMenu = this.getMenu(this.menuPath);
            const menuLength = currentMenu?.childItems?.length;
            if (currentMenu && menuLength) {
                if (key.name === 'down') {
                    if (this.menuItemIndex >= menuLength - 1) {
                        this.menu.move(-menuLength + 1);
                        this.menuItemIndex = 0;
                    } else {
                        this.menu.down(1);
                        this.menuItemIndex++;
                    }
                } else {
                    if (this.menuItemIndex <= 0) {
                        this.menu.move(menuLength - 1);
                        this.menuItemIndex = menuLength - 1;
                    } else {
                        this.menu.up(1);
                        this.menuItemIndex--;
                    }
                }
                this.screen.render();
            }
        });
        this.navigationBox.key(['enter', 'space'], (ch, key) => {
            const currentMenu = this.getMenu(this.menuPath);
            const menuLength = currentMenu?.childItems?.length;
            if (currentMenu?.childItems && menuLength) {
                this.displayBox.pushLine(`actioned using ${ch}, ${key.name}`);
                this.displayBox.pushLine(`Menu Item: ${this.menuItemIndex+1}/${menuLength}, ${currentMenu.childItems[this.menuItemIndex].label}`);
                if (currentMenu.childItems[this.menuItemIndex].childItems?.length) {
                    const childMenuPath = this.getChildMenuPath(currentMenu.childItems[this.menuItemIndex].id);
                    this.updateMenu(childMenuPath);
                }
                this.screen.render();
            }
        });
        this.navigationBox.key(['backspace'], (ch, key) => {
            const currentMenu = this.getMenu(this.menuPath);
            if (currentMenu) {
                const parentPath = this.getParentMenuPath();
                if (this.menuPath) {
                    this.updateMenu(parentPath);
                }
                this.screen.render();
            }
        })
    }

    private updateMenu(path: string | undefined) {
        const menu = this.getMenu(path);
        if (menu && menu.childItems && menu.childItems.length > 0) {
            if (!path) {
                this.menuTitle.setContent(this.options.menu.title);
            } else {
                this.menuTitle.setContent(menu.title || menu.label);
            }
            this.menuPath = path;
            this.menu.setItems(menu.childItems.map(item => item.label));
            this.menu.move(-this.menuItemIndex);
            this.menuItemIndex = 0;
        }
    }

    private setupTextboxEvents() {
        this.textbox.key(['tab'], this.tabFocus);        
        this.textbox.key('enter', (ch, key) => {
            this.displayBox.pushLine(this.textbox.getValue());
            this.textbox.clearValue();
            this.textbox.focus();
            this.screen.render();
        });
        this.setupMouseFocus(this.textbox);
    }

    private setupMouseFocus(screenElement: blessed.Widgets.BoxElement | blessed.Widgets.TextboxElement) {
        screenElement.on('click', (data) => {
            if (screenElement !== this.textbox) {
                this.textbox.clearValue();
                this.textbox.cancel();
            }
            this.tabFocusGroup.forEach((element, index) => {
                if (element !== screenElement) {
                    element.style.border.fg = 'white';
                } else {
                    this.tabFocusGroupIndex = index;
                }
            });
            screenElement.focus();            
            this.screen.render();
        })
    }

    private tabFocus = (ch: any, key: any) => {
        this.textbox.clearValue();
        this.textbox.cancel();
        this.tabFocusGroup[this.tabFocusGroupIndex].style.border.fg = 'white';
        this.tabFocusGroupIndex++;
        if (this.tabFocusGroupIndex >= this.tabFocusGroup.length) {
            this.tabFocusGroupIndex = 0;
        }
        this.tabFocusGroup[this.tabFocusGroupIndex].focus();
        this.screen.render();
    };

    private setupLayout() {
        this.navigationBox.append(this.menuTitle);
        this.navigationBox.append(this.menu);
        this.screen.append(this.navigationBox);
        this.screen.append(this.displayBox);
        this.screen.append(this.textbox);
    }
}