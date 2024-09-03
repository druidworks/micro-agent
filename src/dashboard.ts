import { DashboardUI } from './lib/DashboardUI';

const mdash = new DashboardUI('My window title', {
    screen: {
        smartCSR: true
    },
    menu: {
        title: 'Actions',
        items: [
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
        ]
    }
});

mdash.render();