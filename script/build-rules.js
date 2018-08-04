'use strict'

var fs = require('fs')
var path = require('path')
var inspect = require('util').inspect
var u = require('unist-builder')
var chalk = require('chalk')
var remark = require('remark')
var parseAuthor = require('parse-author')
var remote = require('../package.json').repository
var rules = require('./util/rules')
var rule = require('./util/rule')
var presets = require('./util/presets')
var chars = require('./characters')

var root = path.join(process.cwd(), 'packages')

presets = presets(root).map(function(name) {
  var doc = fs.readFileSync(path.join(root, name, 'index.js'), 'utf8')
  var packages = {}

  doc.replace(/require\('(remark-lint-[^']+)'\)(?:, ([^\]]+)])?/g, function(
    $0,
    rule,
    option
  ) {
    packages[rule] = option || null
    return ''
  })

  return {
    name: name,
    packages: packages
  }
})

rules(root).forEach(function(basename) {
  var base = path.resolve(root, basename)
  var pack = require(path.join(base, 'package.json'))
  var info = rule(base)
  var tests = info.tests
  var author = parseAuthor(pack.author)
  var short = basename.replace(/^remark-/, '')
  var includes
  var children = [
    u('html', '<!--This file is generated-->'),
    u('heading', {depth: 1}, [u('text', basename)])
  ].concat(remark().parse(info.description).children)

  if (basename !== pack.name) {
    throw new Error(
      'Expected package name (`' +
        pack.name +
        '`) to be the same as ' +
        'directory name (`' +
        basename +
        '`)'
    )
  }

  includes = presets.filter(function(preset) {
    return basename in preset.packages
  })

  children.push(u('heading', {depth: 2}, [u('text', 'Presets')]))

  if (includes.length === 0) {
    children.push(
      u('paragraph', [
        u('text', 'This rule is not included in any default preset')
      ])
    )
  } else {
    children.push(
      u('paragraph', [
        u('text', 'This rule is included in the following presets:')
      ]),
      u(
        'table',
        {align: []},
        [
          u('tableRow', [
            u('tableCell', [u('text', 'Preset')]),
            u('tableCell', [u('text', 'Setting')])
          ])
        ].concat(
          includes.map(function(preset) {
            var url = remote + '/tree/master/packages/' + preset.name
            var option = preset.packages[pack.name]

            return u('tableRow', [
              u('tableCell', [
                u('link', {url: url, title: null}, [
                  u('inlineCode', preset.name)
                ])
              ]),
              u('tableCell', option ? [u('inlineCode', option)] : [])
            ])
          })
        )
      )
    )
  }

  Object.keys(tests).forEach(function(setting, index) {
    var fixtures = tests[setting]

    if (index === 0) {
      children.push(u('heading', {depth: 2}, [u('text', 'Example')]))
    }

    Object.keys(fixtures).forEach(function(fileName) {
      var fixture = fixtures[fileName]
      var label = inspect(JSON.parse(setting))
      var clean = fixture.input

      children.push(u('heading', {depth: 5}, [u('inlineCode', fileName)]))

      if (label !== 'true') {
        children.push(
          u('paragraph', [
            u('text', 'When configured with '),
            u('inlineCode', label),
            u('text', '.')
          ])
        )
      }

      if (fixture.input != null && fixture.input.trim() !== '') {
        children.push(u('heading', {depth: 6}, [u('text', 'In')]))

        chars.forEach(function(char) {
          var next = clean.replace(char.in, char.out)

          if (clean !== next) {
            children.push(
              u('paragraph', [
                u('text', 'Note: '),
                u('inlineCode', char.char),
                u('text', ' represents ' + char.name + '.')
              ])
            )

            clean = next
          }
        })

        children.push(u('code', {lang: 'markdown'}, fixture.input))
      }

      children.push(u('heading', {depth: 6}, [u('text', 'Out')]))

      if (fixture.output.length === 0) {
        children.push(u('paragraph', [u('text', 'No messages.')]))
      } else {
        children.push(u('code', {lang: 'text'}, fixture.output.join('\n')))
      }
    })
  })

  children = children.concat([
    u('heading', {depth: 2}, [u('text', 'Install')]),
    u('code', {lang: 'sh'}, 'npm install ' + basename),
    u('heading', {depth: 2}, [u('text', 'Usage')]),
    u('paragraph', [
      u('text', 'You probably want to use it on the CLI through a config file:')
    ]),
    u(
      'code',
      {lang: 'diff'},
      [
        ' ...',
        ' "remarkConfig": {',
        '   "plugins": [',
        '     ...',
        '     "lint",',
        '+    "' + short + '",',
        '     ...',
        '   ]',
        ' }',
        ' ...'
      ].join('\n')
    ),
    u('paragraph', [u('text', 'Or use it on the CLI directly')]),
    u('code', {lang: 'sh'}, 'remark -u lint -u ' + short + ' readme.md'),
    u('paragraph', [u('text', 'Or use this on the API:')]),
    u(
      'code',
      {lang: 'diff'},
      [
        " var remark = require('remark');",
        " var report = require('vfile-reporter');",
        '',
        ' remark()',
        "   .use(require('remark-lint'))",
        "+  .use(require('" + basename + "'))",
        "   .process('_Emphasis_ and **importance**', function (err, file) {",
        '     console.error(report(err || file));',
        '   });'
      ].join('\n')
    ),
    u('heading', {depth: 2}, [u('text', 'License')]),
    u('paragraph', [
      u('link', {url: remote + '/blob/master/LICENSE'}, [
        u('text', pack.license)
      ]),
      u('text', ' © '),
      u('link', {url: author.url}, [u('text', author.name)])
    ])
  ])

  fs.writeFileSync(
    path.join(base, 'readme.md'),
    remark().stringify(u('root', children))
  )

  console.log(chalk.green('✓') + ' wrote `readme.md` in `' + basename + '`')
})
