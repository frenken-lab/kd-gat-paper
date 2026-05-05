// Citation reconciliation validator.
//
// Walks `cite` nodes in the mdast and checks each label/identifier against
// the union of @-keys across paper/references/*.bib. Missing keys fail;
// unused entries warn (warning is collected on the last file processed,
// since "unused" is a corpus-level fact, not a per-file fact).
//
// The bib key set is loaded once and cached on the plugin closure.

import { visit } from 'unist-util-visit';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

let _bibKeys = null;
let _seenCites = null;

function loadBibKeys(bibDir) {
  if (_bibKeys) return _bibKeys;
  const keys = new Set();
  if (!existsSync(bibDir)) {
    _bibKeys = keys;
    return keys;
  }
  const files = readdirSync(bibDir).filter((f) => f.endsWith('.bib'));
  // @type{key,  — match BibTeX entry headers. Captures the key.
  const re = /^\s*@\w+\s*\{\s*([^,\s]+)\s*,/gm;
  for (const f of files) {
    const text = readFileSync(join(bibDir, f), 'utf8');
    for (const m of text.matchAll(re)) keys.add(m[1]);
  }
  _bibKeys = keys;
  return keys;
}

export default function citationsExist({ bibDir, isLastFile = false } = {}) {
  if (!_seenCites) _seenCites = new Set();
  return (tree, file) => {
    const keys = loadBibKeys(bibDir);
    visit(tree, 'cite', (node) => {
      const key = node.label || node.identifier;
      if (!key) return;
      _seenCites.add(key);
      if (!keys.has(key)) {
        const msg = file.message(`Citation key not in bibliography: ${key}`, node);
        msg.fatal = true;
        msg.ruleId = 'citations-exist';
        msg.source = 'kd-gat-validate';
      }
    });
    if (isLastFile) {
      // Corpus-level: any bib key never cited is a warning.
      for (const k of keys) {
        if (!_seenCites.has(k)) {
          const msg = file.message(`Unused bib entry: ${k}`);
          msg.fatal = false;
          msg.ruleId = 'citations-exist:unused';
          msg.source = 'kd-gat-validate';
        }
      }
    }
  };
}

export function _resetCacheForTests() {
  _bibKeys = null;
  _seenCites = null;
}
