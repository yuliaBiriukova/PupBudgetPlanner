import { addons } from 'storybook/manager-api';

// Storybook's keyboard shortcuts off (I-026): Escape pressed in a prototype (closing its dialog or menu) would also
// bring back the sidebar and addons panel that a prototype link hides.
addons.setConfig({ enableShortcuts: false });
