export interface OnboardingStep {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly callout: string;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'hero',
    eyebrow: 'STEP 1 • PICK A JUNK PILOT',
    title: 'BEND ONE RULE, NOT THE WHOLE RUN',
    body: 'Choose a light hero bonus. You are not locking into a class: any hero can still build around any junk family.',
    callout: 'Start with the bonus that looks fun, then pivot when the shop gives you something better.',
  },
  {
    id: 'pack',
    eyebrow: 'STEP 2 • BUILD THE BACKPACK',
    title: 'BUY, DRAG, ROTATE, REPACK',
    body: 'Junk occupies real grid shapes. Fit more value into the 6×5 backpack, and remember that bosses unlock three extra pocket cells as the run advances.',
    callout: 'A legal fit is only the beginning. Where an item touches matters.',
  },
  {
    id: 'synergy',
    eyebrow: 'STEP 3 • MAKE SIDE-CONTACT LINKS',
    title: 'TOUCHING JUNK CHANGES THE BUILD',
    body: 'Orthogonal side contact activates tag synergies such as Battery → Device, Food → Pet and Poison → Weapon. Diagonal contact does nothing.',
    callout: 'Move one item and several links can appear or disappear at once.',
  },
  {
    id: 'fight',
    eyebrow: 'STEP 4 • READ THE BOSS, THEN ADAPT',
    title: 'COMBAT IS AUTOMATIC. COUNTERPLAY IS NOT.',
    body: 'Your packed build fights automatically, but every boss attacks a different weakness: speed concentration, loose geometry, duplicate junk, dominant tags and more.',
    callout: 'Watch the telegraph, then repack or pivot before the next encounter.',
  },
  {
    id: 'fusion',
    eyebrow: 'STEP 5 • TURN GOOD JUNK INTO IMPOSSIBLE JUNK',
    title: 'FUSION UNLOCKS AFTER BOSS 1',
    body: 'Known ingredient pairs can become new items with new shapes, tags and combat profiles. Some late-run recipes require two fusion-only ingredients.',
    callout: 'Finish four worlds, then Cash Out or risk the same build in a full Corrupted Loop.',
  },
];

/**
 * The full Field Manual is deliberately opt-in through HELP.
 *
 * First launch already requires one meaningful hero-selection click before the
 * player can interact with the run. Auto-opening a second five-step modal adds
 * portal friction and delays the core backpack loop. Keep this function as the
 * single policy boundary so an experiment can re-enable automatic onboarding
 * later without coupling the scene to profile heuristics.
 */
export function shouldAutoShowOnboarding(_input: Readonly<{
  hadActiveRun: boolean;
  discoveredItemCount: number;
  discoveredRecipeCount: number;
}>): boolean {
  return false;
}
