import * as Phaser from 'phaser';

const OPEN_MS = 180;
const CLOSE_MS = 120;

export function prefersReducedUiMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function revealOverlay(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  content: Phaser.GameObjects.Container,
): void {
  scene.tweens.killTweensOf(root);
  scene.tweens.killTweensOf(content);
  root.setVisible(true);

  if (prefersReducedUiMotion()) {
    root.setAlpha(1);
    content.setY(0);
    return;
  }

  root.setAlpha(0);
  content.setY(12);
  scene.tweens.add({
    targets: root,
    alpha: 1,
    duration: OPEN_MS,
    ease: 'Quad.Out',
  });
  scene.tweens.add({
    targets: content,
    y: 0,
    duration: OPEN_MS,
    ease: 'Cubic.Out',
  });
}

export function dismissOverlay(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  content: Phaser.GameObjects.Container,
): void {
  scene.tweens.killTweensOf(root);
  scene.tweens.killTweensOf(content);

  if (prefersReducedUiMotion()) {
    root.setAlpha(1).setVisible(false);
    content.setY(0);
    return;
  }

  scene.tweens.add({
    targets: root,
    alpha: 0,
    duration: CLOSE_MS,
    ease: 'Quad.In',
    onComplete: () => {
      root.setAlpha(1).setVisible(false);
      content.setY(0);
    },
  });
  scene.tweens.add({
    targets: content,
    y: 6,
    duration: CLOSE_MS,
    ease: 'Quad.In',
  });
}

export function pressPulse(
  scene: Phaser.Scene,
  targets: readonly Phaser.GameObjects.GameObject[],
  reducedMotion = prefersReducedUiMotion(),
): void {
  if (reducedMotion) return;
  scene.tweens.killTweensOf(targets);
  scene.tweens.add({
    targets,
    scaleX: 0.97,
    scaleY: 0.97,
    duration: 70,
    yoyo: true,
    ease: 'Quad.Out',
  });
}
