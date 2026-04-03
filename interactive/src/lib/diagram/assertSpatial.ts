/**
 * Vitest helper for spatial assertions on diagram layouts.
 *
 * Usage in tests:
 *   import { assertSpatial } from '../../lib/diagram/assertSpatial.ts';
 *
 *   assertSpatial(flatData, [
 *     'vgae_t: left-of gat_t',
 *     'vgae_t: above vgae_s 80 to 250',
 *     'vgae_t: aligned-horizontally gat_t',
 *   ]);
 */

import { expect } from 'vitest';
import type { FlatData } from './flatten.ts';
import { checkSpatial, type CheckSpatialOptions } from './spatial.ts';

/**
 * Assert all spatial relationships hold against FlatData.
 * Throws a vitest assertion failure with detailed diagnostics on any failure.
 */
export function assertSpatial(
  data: FlatData,
  assertions: string[],
  opts?: CheckSpatialOptions,
): void {
  const results = checkSpatial(data, assertions, opts);
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    const msg = failures
      .map(f => `  FAIL: ${f.assertion}\n        ${f.detail}`)
      .join('\n');
    expect.fail(`Spatial assertion failures (${failures.length}/${results.length}):\n${msg}`);
  }
}
