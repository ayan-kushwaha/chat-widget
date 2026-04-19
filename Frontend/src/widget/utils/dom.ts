export function triggerAnimation(element: HTMLElement | null, animation: string, duration: number = 1000) {
    if (!element) return;
    element.style.animation = 'none';
    void element.offsetWidth; // Force Reflow
    element.style.animation = `${animation} ${duration}ms ease-in-out`;
    setTimeout(() => {
        element.style.animation = '';
    }, duration);
}

export function applyPosition(element: HTMLElement, pos: any, launcherSize: number, gap: number = 10) {
    if (!element || !pos) return;
    const offsetX = pos.offsetX || 20;
    const offsetY = pos.offsetY || 20;

    element.style.left = '';
    element.style.right = '';
    element.style.top = '';
    element.style.bottom = '';

    if (pos.horizontal === 'left') {
        element.style.left = `${offsetX + launcherSize + gap}px`;
    } else {
        element.style.right = `${offsetX + launcherSize + gap}px`;
    }

    if (pos.vertical === 'top') {
        element.style.top = `${offsetY}px`;
    } else {
        element.style.bottom = `${offsetY}px`;
    }
}
