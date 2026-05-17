import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getStartExperienceConfig } from '../src/ui/StartExperience.js';

test('start experience uses many slow soft-round particles', () => {
  const config = getStartExperienceConfig();

  assert.ok(config.particleCount >= 300);
  assert.ok(config.particleCount <= 420);
  assert.equal(config.particleShape, 'soft-round');
  assert.equal(config.particleSizing, 'screen-space');
  assert.equal(config.particleDistribution, 'center-radial');
  assert.ok(config.particleSizePx >= 4);
  assert.ok(config.particleSizePx <= 5);
  assert.ok(config.particleOpacity >= 0.18);
  assert.ok(config.particleOpacity <= 0.24);
  assert.ok(config.driftSpeed <= 0.008);
  assert.ok(config.entryDriftBoost <= 0.012);
});
