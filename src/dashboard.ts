import blessed from 'neo-blessed';

const screen = blessed.screen({
    smartCSR: true,
});

screen.title = 'my window title';

const getCommonBoxStyle = () => {
    return {
        border: {
            fg: 'white'
        },
        hover: {
            border: {
                fg: 'green'
            }
        },
        focus: {
            border: {
                fg: '#333333'
            }
        }
    }
}

const navigationBox = blessed.box({
    top: 0,
    left: 0,
    bottom: 3,
    width: 25,
    content: 'Hello {bold}world{/bold}!',
    tags: true,
    border: {
        type: 'line'
    },
    style: getCommonBoxStyle()
});
const menu = blessed.list({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    items: [
        'test',
        'test2',
        'test3'
    ]
});
navigationBox.append(menu);
screen.append(navigationBox);

const displayBox = blessed.box({
    top: 0,
    left: 25,
    right: 0,
    bottom: 3,
    content: 'Hello {bold}world{/bold}!',
    tags: true,
    focusable: false,
    border: {
        type: 'line'
    },
    style: getCommonBoxStyle()
});
screen.append(displayBox);

const textbox = blessed.textbox({
    bottom: 0,
    width: '100%',
    height: 3,
    border: {
        type: 'line'
    },
    style: getCommonBoxStyle(),
    inputOnFocus: true
});
screen.append(textbox);

// -- Events

const tabFocusGroup = [
    navigationBox,
    textbox
];
let tabFocusGroupIndex = 0;
const tabFocus = (ch: any, key: any) => {
    textbox.clearValue();
    textbox.cancel();
    tabFocusGroupIndex++;
    if (tabFocusGroupIndex >= tabFocusGroup.length) {
        tabFocusGroupIndex = 0;
    }
    tabFocusGroup[tabFocusGroupIndex].focus();
    screen.render();
};

screen.key(['tab'], tabFocus);
textbox.key(['tab'], tabFocus);

textbox.on('click', function (data) {
    textbox.focus();
    screen.render();
});

textbox.key('enter', (ch, key) => {
    displayBox.pushLine(textbox.getValue());    
    textbox.clearValue();
    textbox.focus();
    screen.render();
});

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
});

// // Focus our element.
navigationBox.focus();

// Render the screen.
screen.render();