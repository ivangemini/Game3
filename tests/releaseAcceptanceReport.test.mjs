import { describe, expect, it } from 'vitest';
import {
  createAcceptanceTemplate,
  evaluateAcceptance,
  renderAcceptanceMarkdown,
  validateAcceptanceDocument,
} from '../scripts/release-acceptance-report.mjs';

function completeEvidence() {
  const document = createAcceptanceTemplate();
  document.build = {
    sha: 'acd6a0a56533999a78582ec8b8682e46cb5d6235',
    ciRunId: '32961637060',
    portalArtifactDigest: `sha256:${'a'.repeat(64)}`,
    testedAtUtc: '2026-08-26T11:30:00.000Z',
  };
  for (const device of document.devices) {
    device.firstInteractiveMs = 1800;
    device.performance.drag = { medianFrameMs: 16.7, p95FrameMs: 24, worstFrameMs: 61 };
    device.performance.boss = { medianFrameMs: 18.2, p95FrameMs: 31, worstFrameMs: 84 };
    device.canvas = { width: 1688, height: 780, devicePixelRatio: 2 };
    device.network.cold = { requestCount: 12, bytes: 620000 };
    device.network.warm = { requestCount: 4, bytes: 42000 };
    device.checks = {
      backgroundForeground: 'pass',
      orientationRecovery: 'pass',
      adOverlayResume: 'pass',
      webglContextLoss: 'pass',
    };
  }
  for (const portal of document.portals) {
    for (const key of Object.keys(portal.checks)) portal.checks[key] = 'pass';
  }
  return document;
}

describe('release acceptance evidence', () => {
  it('creates a structurally valid but intentionally incomplete template', () => {
    const document = createAcceptanceTemplate();
    expect(validateAcceptanceDocument(document)).toEqual({ valid: true, errors: [] });
    const result = evaluateAcceptance(document);
    expect(result.status).toBe('INCOMPLETE');
    expect(result.incomplete.some((item) => item.includes('Build SHA'))).toBe(true);
    expect(result.incomplete.some((item) => item.includes('frame-time profile'))).toBe(true);
  });

  it('marks complete physical-device and real-portal evidence READY', () => {
    const document = completeEvidence();
    expect(evaluateAcceptance(document)).toEqual({ status: 'READY', blockers: [], incomplete: [], warnings: [] });
    const markdown = renderAcceptanceMarkdown(document);
    expect(markdown).toContain('Status: **READY**');
    expect(markdown).toContain('Yandex Games');
    expect(markdown).toContain('CrazyGames');
    expect(markdown).toContain('16.7 ms / 24.0 ms');
  });

  it('blocks repeatable performance and portal failures', () => {
    const document = completeEvidence();
    document.devices[0].performance.drag.medianFrameMs = 40;
    document.devices[1].performance.boss.p95FrameMs = 175;
    document.portals[0].checks.rewardedNoGrantOnDismiss = 'fail';
    const result = evaluateAcceptance(document);
    expect(result.status).toBe('BLOCKED');
    expect(result.blockers.some((item) => item.includes('below ~30 FPS'))).toBe(true);
    expect(result.blockers.some((item) => item.includes('>150 ms stalls'))).toBe(true);
    expect(result.blockers.some((item) => item.includes('rewardedNoGrantOnDismiss failed'))).toBe(true);
  });

  it('rejects malformed evidence before readiness evaluation', () => {
    const document = completeEvidence();
    document.devices[0].orientation = 'portrait';
    document.portals[1].checks.init = 'maybe';
    const validation = validateAcceptanceDocument(document);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('devices[0].orientation must be landscape');
    expect(validation.errors).toContain('portals[1].checks.init must be one of pass, fail, not-tested, not-applicable');
  });

  it('keeps optional tool-unavailable memory measurements out of the readiness gate', () => {
    const document = completeEvidence();
    document.devices.forEach((device) => {
      device.memory = { peakJsHeapBytes: null, approximateTextureBytes: null };
    });
    expect(evaluateAcceptance(document).status).toBe('READY');
  });
});
