/**
 * @author Titus Wormer
 * @copyright 2017 Titus Wormer
 * @license MIT
 * @module linebreak-style
 * @fileoverview
 *   Warn when linebreaks violate a given or detected style.
 *
 *   Options: either `'unix'` (for `\n`, denoted as `␊`), `'windows'` (for `\r\n`,
 *   denoted as `␍␊`), or `'consistent'` (to detect the first used linebreak in
 *   a file).  Default: `'consistent'`.
 *
 *   ## Fix
 *
 *   [`remark-stringify`](https://github.com/remarkjs/remark/tree/master/packages/remark-stringify)
 *   always uses unix-style linebreaks.
 *
 *   See [Using remark to fix your markdown](https://github.com/remarkjs/remark-lint#using-remark-to-fix-your-markdown)
 *   on how to automatically fix warnings for this rule.
 *
 * @example {"name": "valid-consistent-as-windows.md"}
 *
 *   Alpha␍␊
 *   Bravo␍␊
 *
 * @example {"name": "valid-consistent-as-unix.md"}
 *
 *   Alpha␊
 *   Bravo␊
 *
 * @example {"name": "invalid-unix.md", "label": "input", "setting": "unix", "config": {"positionless": true}}
 *
 *   Alpha␍␊
 *
 * @example {"name": "invalid-unix.md", "label": "output", "setting": "unix"}
 *
 *   1:7: Expected linebreaks to be unix (`\n`), not windows (`\r\n`)
 *
 * @example {"name": "invalid-windows.md", "label": "input", "setting": "windows", "config": {"positionless": true}}
 *
 *   Alpha␊
 *
 * @example {"name": "invalid-windows.md", "label": "output", "setting": "windows"}
 *
 *   1:6: Expected linebreaks to be windows (`\r\n`), not unix (`\n`)
 */

'use strict'

var rule = require('unified-lint-rule')
var location = require('vfile-location')

module.exports = rule('remark-lint:linebreak-style', linebreakStyle)

var escaped = {unix: '\\n', windows: '\\r\\n'}
var types = {true: 'windows', false: 'unix'}

function linebreakStyle(tree, file, pref) {
  var content = String(file)
  var position = location(content).toPosition
  var index = content.indexOf('\n')
  var type
  var reason

  pref = typeof pref === 'string' && pref !== 'consistent' ? pref : null

  while (index !== -1) {
    type = types[content.charAt(index - 1) === '\r']

    if (pref) {
      if (pref !== type) {
        reason =
          'Expected linebreaks to be ' +
          pref +
          ' (`' +
          escaped[pref] +
          '`), ' +
          'not ' +
          type +
          ' (`' +
          escaped[type] +
          '`)'

        file.message(reason, position(index))
      }
    } else {
      pref = type
    }

    index = content.indexOf('\n', index + 1)
  }
}
