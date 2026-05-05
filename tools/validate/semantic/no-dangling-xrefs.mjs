// Cross-reference integrity validator.
//
// mystmd resolves crossReferences during `myst build --site` and writes
// `resolved: true|false` on each node. Unresolved refs warn at build time
// but don't fail. This plugin promotes them to errors so dead "Figure 3" /
// "Eq. (5)" text can't ship.

import { visit } from 'unist-util-visit';

export default function noDanglingXrefs() {
  return (tree, file) => {
    visit(tree, 'crossReference', (node) => {
      if (node.resolved === true) return;
      const id = node.identifier || node.label || '<no identifier>';
      const msg = file.message(`Dangling cross-reference: ${id}`, node);
      msg.fatal = true;
      msg.ruleId = 'no-dangling-xrefs';
      msg.source = 'kd-gat-validate';
    });
  };
}
