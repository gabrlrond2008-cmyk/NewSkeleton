import VM from 'scratch-vm';
import storage from './storage';
import defaultProject from './default-project';

/*
 * Second, independent Scratch VM that backs the "control" (robotics / programación)
 * workspace. It is kept SEPARATE from the main VM so the normal Scratch program and
 * the robotics program are two independent projects saved as two files in the .flynt.
 *
 * The control VM is intentionally NOT started (no green-flag loop, no renderer);
 * it only holds and serializes its own blocks via the same block editor.
 */
const controlVM = new VM();
controlVM.attachStorage(storage);

// Seed the control program with a blank default project so the control workspace
// has targets to edit before any .flynt is opened.
try {
    const def = defaultProject(() => '');
    const projectText = def && def[0] && def[0].data;
    if (projectText) {
        controlVM.loadProject(projectText).catch(() => {});
    }
} catch (e) {}

export default controlVM;