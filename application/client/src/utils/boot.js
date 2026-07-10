export const BOOT_SESSION_KEY = 'boot-seen';
export const BOOT_DURATION_MS = 1250;

export function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Once per tab. Replaying the boot on every visit home would just be in the way. */
export function shouldBoot() {
    if (typeof window === 'undefined') return false;
    if (prefersReducedMotion()) return false;
    return sessionStorage.getItem(BOOT_SESSION_KEY) !== '1';
}
