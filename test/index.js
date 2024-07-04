import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import process from 'node:process'
import test from 'node:test'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import rehypeTwoslash from 'rehype-twoslash'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {read, write} from 'to-vfile'
import {unified} from 'unified'
import {VFile} from 'vfile'

test('rehypeTwoslash', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('rehype-twoslash')).sort(), [
      'default'
    ])
  })

  await t.test('should work w/ `twoslash` class', async function () {
    const file = await unified()
      .use(rehypeParse, {fragment: true})
      .use(rehypeTwoslash)
      .use(rehypeStringify)
      .process(
        `
<pre><code class="language-ts twoslash">const hi = 'Hello'
alert(hi)
</code></pre>
`
      )

    assert.equal(
      String(file),
      `
<div class="highlight highlight-ts">
<pre><code class="language-ts twoslash"><span class="pl-k">const</span> <span class="rehype-twoslash-popover-target" data-popover-target="rehype-twoslash-chHachHa-0"><span class="pl-c1">hi</span></span> <span class="pl-k">=</span> <span class="pl-s"><span class="pl-pds">'</span>Hello<span class="pl-pds">'</span></span>
<span class="rehype-twoslash-popover-target" data-popover-target="rehype-twoslash-chHachHa-1"><span class="pl-en">alert</span></span>(<span class="rehype-twoslash-popover-target" data-popover-target="rehype-twoslash-chHachHa-2"><span class="pl-smi">hi</span></span>)
</code></pre>
<div class="rehype-twoslash-hover rehype-twoslash-popover" id="rehype-twoslash-chHachHa-0" popover=""><pre class="rehype-twoslash-popover-code"><code class="language-ts"><span class="pl-k">const</span> <span class="pl-c1">hi</span><span class="pl-k">:</span> <span class="pl-s"><span class="pl-pds">"</span>Hello<span class="pl-pds">"</span></span></code></pre></div>
<div class="rehype-twoslash-hover rehype-twoslash-popover" id="rehype-twoslash-chHachHa-1" popover=""><pre class="rehype-twoslash-popover-code"><code class="language-ts"><span class="pl-k">function</span> <span class="pl-en">alert</span>(<span class="pl-v">message</span><span class="pl-k">?:</span> <span class="pl-c1">any</span>)<span class="pl-k">:</span> <span class="pl-c1">void</span></code></pre><div class="rehype-twoslash-popover-description"><p><a href="https://developer.mozilla.org/docs/Web/API/Window/alert">MDN Reference</a></p></div></div>
<div class="rehype-twoslash-hover rehype-twoslash-popover" id="rehype-twoslash-chHachHa-2" popover=""><pre class="rehype-twoslash-popover-code"><code class="language-ts"><span class="pl-k">const</span> <span class="pl-c1">hi</span><span class="pl-k">:</span> <span class="pl-s"><span class="pl-pds">"</span>Hello<span class="pl-pds">"</span></span></code></pre></div>
</div>
`
    )
    assert.deepEqual(file.messages.map(String), [])
  })

  await t.test(
    'should warn w/ `twoslash` class, w/o language',
    async function () {
      const file = await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeTwoslash, {directive: false})
        .use(rehypeStringify)
        .process('<pre><code class="twoslash"># hi</code></pre>')

      assert.equal(
        String(file),
        '<pre><code class="twoslash"># hi</code></pre>'
      )
      assert.deepEqual(file.messages.map(String), [
        '1:1-1:46: Unexpected non-js/ts code with twoslash directive, expected JavaScript or TypeScript code'
      ])
    }
  )

  await t.test(
    'should warn w/ `twoslash` class, w/ non-js/ts',
    async function () {
      const file = await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeTwoslash, {directive: false})
        .use(rehypeStringify)
        .process(
          '<pre><code class="language-json twoslash">{"value":3.14}</code></pre>'
        )

      assert.equal(
        String(file),
        '<pre><code class="language-json twoslash">{"value":3.14}</code></pre>'
      )
      assert.deepEqual(file.messages.map(String), [
        '1:1-1:70: Unexpected non-js/ts code (`source.json`) with twoslash directive, expected JavaScript or TypeScript code'
      ])
    }
  )

  await t.test('should do nothing w/o `twoslash` class', async function () {
    const file = await unified()
      .use(rehypeParse, {fragment: true})
      .use(rehypeTwoslash)
      .use(rehypeStringify)
      .process('<pre><code class="language-ts">console.log(3.14)</code></pre>')

    assert.doesNotMatch(String(file), /class="rehype-twoslash-popover-target"/)
    assert.deepEqual(file.messages.map(String), [])
  })

  await t.test(
    'should support `directive: false` w/o `twoslash` class',
    async function () {
      const file = await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeTwoslash, {directive: false})
        .use(rehypeStringify)
        .process(
          '<pre><code class="language-ts twoslash">console.log(3.14)</code></pre>'
        )

      assert.match(String(file), /class="rehype-twoslash-popover-target"/)
      assert.deepEqual(file.messages.map(String), [])
    }
  )

  await t.test(
    'should support `directive: false` w/ `no-twoslash` class',
    async function () {
      const file = await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeTwoslash, {directive: false})
        .use(rehypeStringify)
        .process(
          '<pre><code class="language-ts no-twoslash">console.log(3.14)</code></pre>'
        )

      assert.doesNotMatch(
        String(file),
        /class="rehype-twoslash-popover-target"/
      )
      assert.deepEqual(file.messages.map(String), [])
    }
  )

  await t.test('should support `twoslash` options', async function () {
    /** @type {Array<string>} */
    const calls = []
    const file = await unified()
      .use(rehypeParse, {fragment: true})
      .use(rehypeTwoslash, {
        twoslash: {
          filterNode(node) {
            calls.push(node.type)
            return false
          }
        }
      })
      .use(rehypeStringify)
      .process(
        `<pre><code class="language-ts twoslash">const message = "hi"
console.log(message)
</code></pre>`
      )

    assert.equal(
      String(file),
      `<div class="highlight highlight-ts">
<pre><code class="language-ts twoslash"><span class="pl-k">const</span> <span class="pl-c1">message</span> <span class="pl-k">=</span> <span class="pl-s"><span class="pl-pds">"</span>hi<span class="pl-pds">"</span></span>
<span class="pl-c1">console</span>.<span class="pl-c1">log</span>(<span class="pl-smi">message</span>)
</code></pre>
</div>`
    )

    assert.deepEqual(calls, ['hover', 'hover', 'hover', 'hover'])
    assert.deepEqual(file.messages.map(String), [])
  })

  await t.test(
    'should support custom renderers returning element content',
    async function () {
      const file = await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeTwoslash, {
          renderers: {
            hover(state, annotation, children) {
              return [
                {
                  type: 'element',
                  tagName: 'span',
                  properties: {title: annotation.text, className: ['hover']},
                  children
                }
              ]
            }
          }
        })
        .use(rehypeStringify)
        .process(
          '<pre><code class="language-ts twoslash">console.log("hi")</code></pre>'
        )

      assert.equal(
        String(file),
        `<div class="highlight highlight-ts">
<pre><code class="language-ts twoslash"><span title="var console: Console" class="hover"><span class="pl-c1">console</span></span>.<span title="(method) Console.log(...data: any[]): void" class="hover"><span class="pl-c1">log</span></span>(<span class="pl-s"><span class="pl-pds">"</span>hi<span class="pl-pds">"</span></span>)</code></pre>
</div>`
      )
      assert.deepEqual(file.messages.map(String), [])
    }
  )

  await t.test(
    'should support custom renderers returning a content/footer object',
    async function () {
      const file = await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeTwoslash, {
          renderers: {
            hover(state, annotation, children) {
              const id = state.idPrefix + ++state.count

              return {
                content: [
                  {
                    type: 'element',
                    tagName: 'my-tooltip-reference',
                    properties: {dataTooltipId: id},
                    children
                  }
                ],
                footer: [
                  {
                    type: 'element',
                    tagName: 'my-tooltip',
                    properties: {id},
                    children: [{type: 'text', value: annotation.text}]
                  }
                ]
              }
            }
          }
        })
        .use(rehypeStringify)
        .process(
          '<pre><code class="language-ts twoslash">console.log("hi")</code></pre>'
        )

      assert.equal(
        String(file),
        `<div class="highlight highlight-ts">
<pre><code class="language-ts twoslash"><my-tooltip-reference data-tooltip-id="rehype-twoslash-cc-0"><span class="pl-c1">console</span></my-tooltip-reference>.<my-tooltip-reference data-tooltip-id="rehype-twoslash-cc-1"><span class="pl-c1">log</span></my-tooltip-reference>(<span class="pl-s"><span class="pl-pds">"</span>hi<span class="pl-pds">"</span></span>)</code></pre>
<my-tooltip id="rehype-twoslash-cc-0">var console: Console</my-tooltip>
<my-tooltip id="rehype-twoslash-cc-1">(method) Console.log(...data: any[]): void</my-tooltip>
</div>`
      )
      assert.deepEqual(file.messages.map(String), [])
    }
  )

  await t.test('should support custom tags', async function () {
    const file = await unified()
      .use(rehypeParse, {fragment: true})
      .use(rehypeTwoslash, {twoslash: {customTags: ['thing']}})
      .use(rehypeStringify)
      .process(
        `<pre><code class="language-ts twoslash">// @thing: OK, sure
const a = "123"
// @thingTwo - This should stay (note the no ':')
const b = 12331234
</code></pre>`
      )

    assert.equal(
      String(file),
      `<div class="highlight highlight-ts">
<pre><code class="language-ts twoslash"><span class="pl-k">const</span> <span class="rehype-twoslash-popover-target" data-popover-target="rehype-twoslash-tOscncb1-0"><span class="pl-c1">a</span></span> <span class="pl-k">=</span> <span class="pl-s"><span class="pl-pds">"</span>123<span class="pl-pds">"</span></span>
<span class="pl-c">// @thingTwo - This should stay (note the no ':')</span>
<span class="pl-k">const</span> <span class="rehype-twoslash-popover-target" data-popover-target="rehype-twoslash-tOscncb1-1"><span class="pl-c1">b</span></span> <span class="pl-k">=</span> <span class="pl-c1">12331234</span>
</code></pre>
<div class="rehype-twoslash-hover rehype-twoslash-popover" id="rehype-twoslash-tOscncb1-0" popover=""><pre class="rehype-twoslash-popover-code"><code class="language-ts"><span class="pl-k">const</span> <span class="pl-c1">a</span><span class="pl-k">:</span> <span class="pl-s"><span class="pl-pds">"</span>123<span class="pl-pds">"</span></span></code></pre></div>
<div class="rehype-twoslash-hover rehype-twoslash-popover" id="rehype-twoslash-tOscncb1-1" popover=""><pre class="rehype-twoslash-popover-code"><code class="language-ts"><span class="pl-k">const</span> <span class="pl-c1">b</span><span class="pl-k">:</span> <span class="pl-c1">12331234</span></code></pre></div>
</div>`
    )

    assert.deepEqual(file.messages.map(String), [])
  })

  await t.test('should support a custom id prefix', async function () {
    const file = await unified()
      .use(rehypeParse, {fragment: true})
      .use(rehypeTwoslash, {idPrefix: 'custom-'})
      .use(rehypeStringify)
      .process(
        `<pre><code class="language-ts twoslash">console.log('hi')</code></pre>`
      )

    assert.equal(
      String(file),
      `<div class="highlight highlight-ts">
<pre><code class="language-ts twoslash"><span class="rehype-twoslash-popover-target" data-popover-target="custom-cc-0"><span class="pl-c1">console</span></span>.<span class="rehype-twoslash-popover-target" data-popover-target="custom-cc-1"><span class="pl-c1">log</span></span>(<span class="pl-s"><span class="pl-pds">'</span>hi<span class="pl-pds">'</span></span>)</code></pre>
<div class="rehype-twoslash-hover rehype-twoslash-popover" id="custom-cc-0" popover=""><pre class="rehype-twoslash-popover-code"><code class="language-ts"><span class="pl-k">var</span> <span class="pl-smi">console</span><span class="pl-k">:</span> <span class="pl-en">Console</span></code></pre></div>
<div class="rehype-twoslash-hover rehype-twoslash-popover" id="custom-cc-1" popover=""><pre class="rehype-twoslash-popover-code"><code class="language-ts">(<span class="pl-smi">method</span>) <span class="pl-c1">Console</span>.<span class="pl-en">log</span>(<span class="pl-k">...</span><span class="pl-smi">data</span>: <span class="pl-smi">any</span>[]): <span class="pl-k">void</span></code></pre><div class="rehype-twoslash-popover-description"><p><a href="https://developer.mozilla.org/docs/Web/API/console/log_static">MDN Reference</a></p></div></div>
</div>`
    )

    assert.deepEqual(file.messages.map(String), [])
  })

  await t.test('should report `twoslash` errors', async function () {
    const file = await unified()
      .use(rehypeParse, {fragment: true})
      .use(rehypeTwoslash)
      .use(rehypeStringify)
      .process(
        `<pre><code class="language-ts twoslash">// @annotate: left
</code></pre>`
      )

    assert.deepEqual(file.messages.map(String), [
      '1:1-2:14: Unexpected error running twoslash'
    ])
  })

  await t.test('should warn w/ `notwoslash` class', async function () {
    const file = await unified()
      .use(rehypeParse, {fragment: true})
      .use(rehypeTwoslash, {directive: false})
      .use(rehypeStringify)
      .process('<pre><code class="notwoslash"># hi</code></pre>')

    assert.equal(
      String(file),
      '<pre><code class="notwoslash"># hi</code></pre>'
    )
    assert.deepEqual(file.messages.map(String), [
      '1:1-1:48: Unexpected `notwoslash` class, expected `no-twoslash`'
    ])
  })

  await t.test('should warn w/ `notwoslash` directive', async function () {
    const file = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeTwoslash)
      .use(rehypeStringify)
      .process('```markdown notwoslash\n# hi')

    assert.equal(
      String(file),
      '<pre><code class="language-markdown"># hi\n</code></pre>'
    )
    assert.deepEqual(file.messages.map(String), [
      '1:1-2:5: Unexpected `notwoslash` directive, expected `no-twoslash`'
    ])
  })

  await t.test(
    'should integrate w/ remark w/ twoslash directive',
    async function () {
      const file = await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeTwoslash)
        .use(rehypeStringify)
        .process(
          `
~~~ts twoslash
console.log(3.14)
~~~
`
        )

      assert.equal(
        String(file),
        `<div class="highlight highlight-ts">
<pre><code class="language-ts"><span class="rehype-twoslash-popover-target" data-popover-target="rehype-twoslash-cc-0"><span class="pl-c1">console</span></span>.<span class="rehype-twoslash-popover-target" data-popover-target="rehype-twoslash-cc-1"><span class="pl-c1">log</span></span>(<span class="pl-c1">3.14</span>)
</code></pre>
<div class="rehype-twoslash-hover rehype-twoslash-popover" id="rehype-twoslash-cc-0" popover=""><pre class="rehype-twoslash-popover-code"><code class="language-ts"><span class="pl-k">var</span> <span class="pl-smi">console</span><span class="pl-k">:</span> <span class="pl-en">Console</span></code></pre></div>
<div class="rehype-twoslash-hover rehype-twoslash-popover" id="rehype-twoslash-cc-1" popover=""><pre class="rehype-twoslash-popover-code"><code class="language-ts">(<span class="pl-smi">method</span>) <span class="pl-c1">Console</span>.<span class="pl-en">log</span>(<span class="pl-k">...</span><span class="pl-smi">data</span>: <span class="pl-smi">any</span>[]): <span class="pl-k">void</span></code></pre><div class="rehype-twoslash-popover-description"><p><a href="https://developer.mozilla.org/docs/Web/API/console/log_static">MDN Reference</a></p></div></div>
</div>`
      )
      assert.deepEqual(file.messages.map(String), [])
    }
  )

  await t.test(
    'should integrate w/ remark, do nothing w/o twoslash directive',
    async function () {
      const file = await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeTwoslash)
        .use(rehypeStringify)
        .process(
          `
~~~ts
console.log(3.14)
~~~
`
        )

      assert.doesNotMatch(
        String(file),
        /class="rehype-twoslash-popover-target"/
      )
      assert.deepEqual(file.messages.map(String), [])
    }
  )

  await t.test(
    'should integrate w/ remark, support `directive: false` w/o `twoslash` directive',
    async function () {
      const file = await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeTwoslash, {directive: false})
        .use(rehypeStringify)
        .process(
          `
~~~ts
console.log(3.14)
~~~
`
        )

      assert.match(String(file), /class="rehype-twoslash-popover-target"/)
      assert.deepEqual(file.messages.map(String), [])
    }
  )

  await t.test(
    'should integrate w/ remark, support `directive: false` w/ `no-twoslash` directive',
    async function () {
      const file = await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeTwoslash, {directive: false})
        .use(rehypeStringify)
        .process(
          `
~~~ts no-twoslash
console.log(3.14)
~~~
`
        )

      assert.doesNotMatch(
        String(file),
        /class="rehype-twoslash-popover-target"/
      )
      assert.deepEqual(file.messages.map(String), [])
    }
  )

  await t.test('should support an ast', async function () {
    const tree = await unified()
      .use(rehypeTwoslash)
      .run({
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'pre',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'code',
                properties: {className: ['language-ts', 'twoslash']},
                children: [{type: 'text', value: 'console.log(3.14)\n'}]
              }
            ]
          }
        ]
      })

    assert.deepEqual(tree, {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'div',
          properties: {className: ['highlight', 'highlight-ts']},
          children: [
            {type: 'text', value: '\n'},
            {
              type: 'element',
              tagName: 'pre',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'code',
                  properties: {className: ['language-ts', 'twoslash']},
                  children: [
                    {
                      type: 'element',
                      tagName: 'span',
                      properties: {
                        className: ['rehype-twoslash-popover-target'],
                        dataPopoverTarget: 'rehype-twoslash-cc-0'
                      },
                      children: [
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-c1']},
                          children: [{type: 'text', value: 'console'}]
                        }
                      ]
                    },
                    {type: 'text', value: '.'},
                    {
                      type: 'element',
                      tagName: 'span',
                      properties: {
                        className: ['rehype-twoslash-popover-target'],
                        dataPopoverTarget: 'rehype-twoslash-cc-1'
                      },
                      children: [
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-c1']},
                          children: [{type: 'text', value: 'log'}]
                        }
                      ]
                    },
                    {type: 'text', value: '('},
                    {
                      type: 'element',
                      tagName: 'span',
                      properties: {className: ['pl-c1']},
                      children: [{type: 'text', value: '3.14'}]
                    },
                    {type: 'text', value: ')\n'}
                  ]
                }
              ]
            },
            {type: 'text', value: '\n'},
            {
              type: 'element',
              tagName: 'div',
              properties: {
                className: ['rehype-twoslash-hover', 'rehype-twoslash-popover'],
                id: 'rehype-twoslash-cc-0',
                popover: ''
              },
              children: [
                {
                  type: 'element',
                  tagName: 'pre',
                  properties: {className: ['rehype-twoslash-popover-code']},
                  children: [
                    {
                      type: 'element',
                      tagName: 'code',
                      properties: {className: ['language-ts']},
                      children: [
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-k']},
                          children: [{type: 'text', value: 'var'}]
                        },
                        {type: 'text', value: ' '},
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-smi']},
                          children: [{type: 'text', value: 'console'}]
                        },
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-k']},
                          children: [{type: 'text', value: ':'}]
                        },
                        {type: 'text', value: ' '},
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-en']},
                          children: [{type: 'text', value: 'Console'}]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {type: 'text', value: '\n'},
            {
              type: 'element',
              tagName: 'div',
              properties: {
                className: ['rehype-twoslash-hover', 'rehype-twoslash-popover'],
                id: 'rehype-twoslash-cc-1',
                popover: ''
              },
              children: [
                {
                  type: 'element',
                  tagName: 'pre',
                  properties: {className: ['rehype-twoslash-popover-code']},
                  children: [
                    {
                      type: 'element',
                      tagName: 'code',
                      properties: {className: ['language-ts']},
                      children: [
                        {type: 'text', value: '('},
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-smi']},
                          children: [{type: 'text', value: 'method'}]
                        },
                        {type: 'text', value: ') '},
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-c1']},
                          children: [{type: 'text', value: 'Console'}]
                        },
                        {type: 'text', value: '.'},
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-en']},
                          children: [{type: 'text', value: 'log'}]
                        },
                        {type: 'text', value: '('},
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-k']},
                          children: [{type: 'text', value: '...'}]
                        },
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-smi']},
                          children: [{type: 'text', value: 'data'}]
                        },
                        {type: 'text', value: ': '},
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-smi']},
                          children: [{type: 'text', value: 'any'}]
                        },
                        {type: 'text', value: '[]): '},
                        {
                          type: 'element',
                          tagName: 'span',
                          properties: {className: ['pl-k']},
                          children: [{type: 'text', value: 'void'}]
                        }
                      ]
                    }
                  ]
                },
                {
                  type: 'element',
                  tagName: 'div',
                  properties: {
                    className: ['rehype-twoslash-popover-description']
                  },
                  children: [
                    {
                      type: 'element',
                      tagName: 'p',
                      properties: {},
                      children: [
                        {
                          type: 'element',
                          tagName: 'a',
                          properties: {
                            href: 'https://developer.mozilla.org/docs/Web/API/console/log_static'
                          },
                          children: [{type: 'text', value: 'MDN Reference'}]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {type: 'text', value: '\n'}
          ]
        }
      ]
    })
  })
})

test('fixtures', async function (t) {
  const base = new URL('fixtures/', import.meta.url)
  const folders = await fs.readdir(base)

  for (const folder of folders) {
    if (folder.charAt(0) === '.') continue

    await t.test(folder, async function () {
      const folderUrl = new URL(folder + '/', base)
      const outputUrl = new URL('output.html', folderUrl)
      const input = await read(new URL('input.html', folderUrl))
      const processor = await unified()
        .use(rehypeParse, {fragment: true})
        .use(rehypeTwoslash, {directive: false})
        .use(rehypeStringify)

      await processor.process(input)

      /** @type {VFile} */
      let output

      try {
        if ('UPDATE' in process.env) {
          throw new Error('Updating…')
        }

        output = await read(outputUrl)
        output.value = String(output)
      } catch {
        output = new VFile({
          path: outputUrl,
          value: String(input)
        })
        await write(output)
      }

      assert.equal(String(input), String(output))
      assert.deepEqual(input.messages.map(String), [])
    })
  }
})
