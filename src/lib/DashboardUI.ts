import blessed from 'neo-blessed';

interface StyleGuideItem {
    fg: string;
    bg: string;
}
export type StyleGuide = {
    primary: StyleGuideItem;
    secondary: StyleGuideItem;
    tertiary: StyleGuideItem;
    content: StyleGuideItem;
    highlight: StyleGuideItem;
    focus: StyleGuideItem;
    hover: StyleGuideItem;
}

export interface DashboardMenuItem {
    id: string;
    label: string;
    title?: string;
    childItems?: DashboardMenuItem[];
    callback?: (menuItem: DashboardMenuItem) => Promise<boolean> | boolean;
}

export interface DashboardMenu {
    title: string;
    items: DashboardMenuItem[];
}

export interface DashboardUIOptions {
    screen: blessed.Widgets.IScreenOptions;
    menu?: {
        title: string;
        items: DashboardMenuItem[];
    };
    styleGuide?: Partial<StyleGuide>;
}

const defaultStyleGuide: StyleGuide = {
    primary: {
        fg: 'green',
        bg: 'black',
    },
    secondary: {
        fg: '#33AA33',
        bg: 'black',
    },
    tertiary: {
        fg: 'lightblue',
        bg: 'black',
    },
    content: {
        fg: 'white',
        bg: 'black',
    },
    highlight: {
        fg: 'black',
        bg: 'green',
    },
    focus: {
        fg: 'green',
        bg: 'black',
    },
    hover: {
        fg: '#33AA33',
        bg: 'black',
    },
}

const getCommonBoxStyle = (options?: { focusable?: boolean; styleGuide: StyleGuide }) => {
    const { focusable = true, styleGuide = defaultStyleGuide } = options || {};
    const baseStyle: Record<string, any> = {
        border: {
            fg: styleGuide.content.fg,
        }
    };
    if (focusable) {
        baseStyle.hover = {
            border: {
                fg: styleGuide.hover.fg,
            }
        };
        baseStyle.focus = {
            border: {
                fg: styleGuide.focus.fg,
            }
        };
    }
    return baseStyle;
}

export class DashboardUI {
    private options: DashboardUIOptions;
    private screen: blessed.Widgets.Screen;
    private styleGuide: StyleGuide;

    private elements: {
        headerBox: blessed.Widgets.BoxElement;
        navigationBox?: blessed.Widgets.BoxElement;
        menuTitle?: blessed.Widgets.TextElement;
        menu?: blessed.Widgets.ListElement;
        displayBox: blessed.Widgets.BoxElement;
        textbox: blessed.Widgets.TextboxElement;
    }

    private tabFocusGroupIndex = 0;
    private tabFocusGroup: (blessed.Widgets.BoxElement | blessed.Widgets.TextboxElement)[] = [];

    private menuEnabled: boolean;
    private menuPath: string | undefined;
    private menuItemIndex = 0;
    private menuOptions: DashboardMenu | undefined;

    constructor(title: string, options: DashboardUIOptions) {
        this.options = options;
        this.styleGuide = {
            ...defaultStyleGuide,
            ...options.styleGuide
        }
        this.screen = blessed.screen({
            style: {
                fg: this.styleGuide.content.fg,
                bg: this.styleGuide.content.bg,
            },
            ...options.screen
        });
        this.screen.title = title;


        const headerBox = blessed.box({
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            content: title.toUpperCase(),
            style: {
                fg: this.styleGuide.primary.fg,
                bold: true,
            }
        });

        let navigationBox, menuTitle, menu;
        this.menuEnabled = !!options.menu;
        if (this.menuEnabled && options.menu) {
            this.menuOptions = { ...options.menu };
            navigationBox = blessed.box({
                top: 1,
                left: 0,
                bottom: 3,
                width: 20,
                content: '',
                tags: true,
                border: {
                    type: 'line'
                },
                style: getCommonBoxStyle({ styleGuide: this.styleGuide }),
            });
            menuTitle = blessed.text({
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                content: 'Actions',
                style: {
                    fg: this.styleGuide.secondary.fg,
                    bold: true,
                }
            })
            menu = blessed.list({
                top: 2,
                left: 0,
                right: 0,
                bottom: 0,
                items: this.parseMenuItems(options.menu.items),
                style: {
                    selected: {
                        fg: this.styleGuide.focus.fg,
                    }
                }
            });
        }

        const displayBox = blessed.box({
            top: 1,
            left: this.menuEnabled ? 20 : 0,
            right: 0,
            bottom: 3,
            content: '',
            tags: true,
            focusable: false,
            border: {
                type: 'line'
            },
            style: getCommonBoxStyle({ focusable: false, styleGuide: this.styleGuide })
        });
        const textbox = this.createTextbox();
        this.elements = {
            headerBox,
            navigationBox,
            menuTitle,
            menu,
            displayBox,
            textbox
        };
        this.tabFocusGroup = [
            this.elements.textbox
        ];
        if (this.menuEnabled && this.elements.navigationBox) {
            this.tabFocusGroup.unshift(this.elements.navigationBox);
        }
        this.setupEvents();
    }

    public render() {
        this.setupLayout();
        this.screen.render();
        if (this.menuEnabled) {
            this.elements.navigationBox?.focus();
        } else {
            this.elements.textbox.focus();
        }
    }

    public updateMenu(menu: DashboardMenu) {
        this.menuEnabled = true;
        this.menuPath = undefined;
        this.menuItemIndex = 0;
        this.menuOptions = menu;
        this.updateMenuElements(this.menuPath);
        this.render();
    }

    public async promptText(prompt: string, initialValue?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const dialog = this.createDialog(prompt);
            const textbox = this.createTextbox();
            textbox.key('enter', (ch, key) => {
                const value = textbox.getValue().trim();
                textbox.removeAllListeners();
                dialog.remove(textbox);
                this.screen.remove(dialog);
                this.screen.render();
                resolve(value);
            });
            if (initialValue) {
                textbox.setValue(initialValue);
            }
            dialog.append(textbox);
            this.screen.append(dialog);
            textbox.focus();
            this.screen.render();
        })
    }

    public async promptSelect(prompt: string, options: { value: string; label: string; }[], isMulti: boolean = false): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const selected = new Set<number>();
            const dialog = this.createDialog(`${prompt} (Press number to select, Press enter to confirm)`);
            const list = this.createList();
            const updateListItems = () => {
                list.setItems(options.map((o, i) => {
                    const prefix = isMulti ? `[${selected.has(i + 1) ? 'X' : ' '}] ` : '';
                    return `${prefix}${i + 1}. ${o.label}`;
                }));
            }
            const resolveResponse = () => {                
                this.screen.remove(dialog);
                const selectedIndexes = Array.from(selected);
                resolve(selectedIndexes.map(i => options[i - 1].value));
            }
            list.key(options.map((o, i) => `${i + 1}`),
                (ch, key) => {
                    const targetIndex = parseInt(key.name, 10);
                    if (!selected.has(targetIndex)) {
                        selected.add(targetIndex);
                    } else {
                        selected.delete(targetIndex);
                    }
                    if (isMulti) {
                        updateListItems();
                        this.screen.render();                        
                    } else {
                        resolveResponse();
                    }
                }
            );
            list.key(['enter'], async (ch, key) => {
                resolveResponse();
            });
            updateListItems();
            dialog.append(list);
            this.screen.append(dialog);
            this.screen.render();
        });
    }

    private createDialog(title: string) {
        return blessed.box({
            top: 4,
            right: 4,
            bottom: 4,
            left: 4,
            content: title,
            tags: true,
            focusable: false,
            border: {
                type: 'line'
            },
            style: {
                border: {
                    fg: 'yellow'
                }
            }
        });
    }

    private createTextbox() {
        return blessed.textbox({
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            border: {
                type: 'line'
            },
            style: getCommonBoxStyle({ styleGuide: this.styleGuide }),
            inputOnFocus: true
        });
    }

    private createList(items?: string[]) {
        return blessed.list({
            top: 2,
            left: 0,
            right: 0,
            bottom: 0,
            items: items,
            style: {
                selected: {
                    fg: this.styleGuide.focus.fg,
                }
            }
        });
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

    private parseMenuItems(items: DashboardMenuItem[]): string[] {
        return items.map(item => item.label);
    }

    private getMenu(path?: string): DashboardMenuItem | undefined {
        if (this.menuOptions) {
            if (!path) {
                return { id: '', label: '', title: this.menuOptions.title, childItems: this.menuOptions.items };
            }
            const pathSegments = path.split('.');
            const id = pathSegments.shift();
            if (id) {
                const menuItem = this.menuOptions.items.find((item) => item.id === id);
                if (menuItem) {
                    return menuItem;
                } else {
                    return this.getMenu(pathSegments.join('.'));
                }
            }
        }
        return;
    }

    private setupNavigationEvents() {
        if (this.elements.navigationBox) {
            this.setupMouseFocus(this.elements.navigationBox);
            this.elements.navigationBox.key(['up', 'down'], (ch, key) => {
                const currentMenu = this.getMenu(this.menuPath);
                const menuLength = currentMenu?.childItems?.length;
                if (currentMenu && menuLength) {
                    if (key.name === 'down') {
                        if (this.menuItemIndex >= menuLength - 1) {
                            this.elements.menu?.move(-menuLength + 1);
                            this.menuItemIndex = 0;
                        } else {
                            this.elements.menu?.down(1);
                            this.menuItemIndex++;
                        }
                    } else {
                        if (this.menuItemIndex <= 0) {
                            this.elements.menu?.move(menuLength - 1);
                            this.menuItemIndex = menuLength - 1;
                        } else {
                            this.elements.menu?.up(1);
                            this.menuItemIndex--;
                        }
                    }
                    this.screen.render();
                }
            });
            this.elements.navigationBox.key(['enter', 'space'], async (ch, key) => {
                const currentMenu = this.getMenu(this.menuPath);
                const menuLength = currentMenu?.childItems?.length;
                if (currentMenu?.childItems && menuLength) {
                    this.elements.displayBox.pushLine(`actioned using ${ch}, ${key.name}`);
                    this.elements.displayBox.pushLine(`Menu Item: ${this.menuItemIndex + 1}/${menuLength}, ${currentMenu.childItems[this.menuItemIndex].label}`);
                    const callback = currentMenu.childItems[this.menuItemIndex].callback;
                    if (callback) {
                        await callback(currentMenu.childItems[this.menuItemIndex]);
                    }
                    if (currentMenu.childItems[this.menuItemIndex].childItems?.length) {
                        const childMenuPath = this.getChildMenuPath(currentMenu.childItems[this.menuItemIndex].id);
                        this.updateMenuElements(childMenuPath);
                    }
                    this.screen.render();
                }
            });
            this.elements.navigationBox.key(['backspace'], (ch, key) => {
                const currentMenu = this.getMenu(this.menuPath);
                if (currentMenu) {
                    const parentPath = this.getParentMenuPath();
                    if (this.menuPath) {
                        this.updateMenuElements(parentPath);
                    }
                    this.screen.render();
                }
            })
        }
    }

    private updateMenuElements(path: string | undefined) {
        if (this.elements.menu && this.elements.menuTitle) {
            const menu = this.getMenu(path);
            if (menu && menu.childItems && menu.childItems.length > 0) {
                this.menuPath = path;
                this.elements.menuTitle.setContent(menu.title || menu.label);
                this.elements.menu.setItems(this.parseMenuItems(menu.childItems));
                this.elements.menu.move(-this.menuItemIndex);
                this.menuItemIndex = 0;
            }
        }
    }

    private setupTextboxEvents() {
        this.elements.textbox.key(['tab'], this.tabFocus);
        this.elements.textbox.key('enter', (ch, key) => {
            this.elements.displayBox.pushLine(this.elements.textbox.getValue());
            this.elements.textbox.clearValue();
            this.elements.textbox.focus();
            this.screen.render();
        });
        this.setupMouseFocus(this.elements.textbox);
    }

    private setupMouseFocus(screenElement: blessed.Widgets.BoxElement | blessed.Widgets.TextboxElement) {
        screenElement.on('click', (data) => {
            if (screenElement !== this.elements.textbox) {
                this.elements.textbox.clearValue();
                this.elements.textbox.cancel();
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
        this.elements.textbox.clearValue();
        this.elements.textbox.cancel();
        this.tabFocusGroup[this.tabFocusGroupIndex].style.border.fg = 'white';
        this.tabFocusGroupIndex++;
        if (this.tabFocusGroupIndex >= this.tabFocusGroup.length) {
            this.tabFocusGroupIndex = 0;
        }
        this.tabFocusGroup[this.tabFocusGroupIndex].focus();
        this.screen.render();
    };

    private setupLayout() {
        this.screen.append(this.elements.headerBox);
        if (this.menuEnabled && this.elements.navigationBox) {
            if (this.elements.menuTitle) {
                this.elements.navigationBox.append(this.elements.menuTitle);
            }
            if (this.elements.menu) {
                this.elements.navigationBox.append(this.elements.menu);
            }
            this.screen.append(this.elements.navigationBox);
        }
        this.screen.append(this.elements.displayBox);
        this.screen.append(this.elements.textbox);
    }
}