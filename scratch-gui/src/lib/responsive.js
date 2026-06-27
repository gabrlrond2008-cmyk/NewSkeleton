import {BREAKPOINTS} from './layout-constants';

export {BREAKPOINTS};

export const DEVICE = {
    PHONE: 'phone',
    TABLET: 'tablet',
    DESKTOP: 'desktop'
};

export function getDevice(width) {
    if (width <= BREAKPOINTS.PHONE_MAX) return DEVICE.PHONE;
    if (width <= BREAKPOINTS.TABLET_MAX) return DEVICE.TABLET;
    return DEVICE.DESKTOP;
}

export function createBreakpointListener(onChange) {
    const phoneMql = window.matchMedia(`(max-width: ${BREAKPOINTS.PHONE_MAX}px)`);
    const tabletMin = BREAKPOINTS.PHONE_MAX + 1;
    const tabletMql = window.matchMedia(
        `(max-width: ${BREAKPOINTS.TABLET_MAX}px) and (min-width: ${tabletMin}px)`
    );
    const desktopMql = window.matchMedia(`(min-width: ${BREAKPOINTS.TABLET_MAX + 1}px)`);

    const handler = () => {
        const device = getDevice(window.innerWidth);
        onChange(device);
    };

    phoneMql.addListener(handler);
    tabletMql.addListener(handler);
    desktopMql.addListener(handler);

    return () => {
        phoneMql.removeListener(handler);
        tabletMql.removeListener(handler);
        desktopMql.removeListener(handler);
    };
}
