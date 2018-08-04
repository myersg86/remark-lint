/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module no-missing-blank-lines
 * @fileoverview
 *   Warn when missing blank lines before a block node.
 *
 *   This rule can be configured to allow tight list items without blank lines
 *   between their contents by passing `{exceptTightLists: true}` (default:
 *   `false`).
 *
 *   ## Fix
 *
 *   [`remark-stringify`](https://github.com/remarkjs/remark/tree/master/packages/remark-stringify)
 *   always uses one blank line between blocks if possible, or two lines when
 *   needed. The style of the list-items persists.
 *
 *   See [Using remark to fix your markdown](https://github.com/remarkjs/remark-lint#using-remark-to-fix-your-markdown)
 *   on how to automatically fix warnings for this rule.
 *
 * @example {"name": "valid.md"}
 *
 *   # Foo
 *
 *   ## Bar
 *
 *   - Paragraph
 *
 *     + List.
 *
 *   Paragraph.
 *
 * @example {"name": "invalid.md", "label": "input"}
 *
 *   # Foo
 *   ## Bar
 *
 *   - Paragraph
 *     + List.
 *
 *   Paragraph.
 *
 * @example {"name": "invalid.md", "label": "output"}
 *
 *   2:1-2:7: Missing blank line before block node
 *   5:3-5:10: Missing blank line before block node
 *
 * @example {"name": "tight.md", "setting": {"exceptTightLists": true}, "label": "input"}
 *
 *   # Foo
 *   ## Bar
 *
 *   - Paragraph
 *     + List.
 *
 *   Paragraph.
 *
 * @example {"name": "tight.md", "setting": {"exceptTightLists": true}, "label": "output"}
 *
 *   2:1-2:7: Missing blank line before block node
 */

'use strict'

var rule = require('unified-lint-rule')
var visit = require('unist-util-visit')
var position = require('unist-util-position')
var generated = require('unist-util-generated')

module.exports = rule('remark-lint:no-missing-blank-lines', noMissingBlankLines)

var reason = 'Missing blank line before block node'

var types = [
  'paragraph',
  'blockquote',
  'heading',
  'code',
  'yaml',
  'html',
  'list',
  'table',
  'thematicBreak'
]

function noMissingBlankLines(tree, file, pref) {
  var allow = (pref || {}).exceptTightLists

  visit(tree, visitor)

  function visitor(node, index, parent) {
    var next

    if (!generated(node) && parent && (!allow || parent.type !== 'listItem')) {
      next = parent.children[index + 1]

      if (
        next &&
        types.indexOf(next.type) !== -1 &&
        position.start(next).line === position.end(node).line + 1
      ) {
        file.message(reason, next)
      }
    }
  }
}
