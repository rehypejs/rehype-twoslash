/**
 * @import {ElementContent} from 'hast'
 * @import {BlockContent, DefinitionContent, List, Root} from 'mdast'
 * @import {NodeCompletion, NodeError, NodeHighlight, NodeHover, NodeQuery} from 'twoslash'
 * @import {RenderResult, Render, State} from './types.js'
 */

import {ok as assert} from 'devlop'
import {toString} from 'hast-util-to-string'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {gfmFromMarkdown} from 'mdast-util-gfm'
import {toHast} from 'mdast-util-to-hast'
import {gfm} from 'micromark-extension-gfm'
import {removePosition} from 'unist-util-remove-position'
import {SKIP, visitParents} from 'unist-util-visit-parents'

/**
 * Prefix for language classes.
 */
const prefix = 'language-'

/**
 * @param {State} state
 * @param {NodeCompletion} annotation
 * @param {Array<ElementContent>} between
 * @returns {RenderResult}
 * @satisfies {Render<NodeCompletion>}
 */
export function completion(state, annotation, between) {
  const id = state.idPrefix + ++state.count
  /** @type {Array<ElementContent>} */
  const items = []

  for (const completion of annotation.completions) {
    if (items.length > 10) {
      items.push({
        type: 'element',
        tagName: 'li',
        properties: {className: ['rehype-twoslash-completions-more']},
        children: [{type: 'text', value: '…'}]
      })
      break
    }

    const className = ['rehype-twoslash-completion']
    /** @type {Array<ElementContent>} */
    const children =
      completion.name.startsWith(annotation.completionsPrefix) &&
      completion.name !== annotation.completionsPrefix
        ? [
            {
              type: 'element',
              tagName: 'span',
              properties: {className: ['rehype-twoslash-match']},
              children: [{type: 'text', value: annotation.completionsPrefix}]
            },
            {
              type: 'element',
              tagName: 'span',
              properties: {className: ['rehype-twoslash-completion-swap']},
              children: [
                {
                  type: 'text',
                  value: completion.name.slice(
                    annotation.completionsPrefix.length
                  )
                }
              ]
            }
          ]
        : [
            {
              type: 'element',
              tagName: 'span',
              properties: {className: ['rehype-twoslash-completion-swap']},
              children: [{type: 'text', value: completion.name}]
            }
          ]

    if (
      'kindModifiers' in completion &&
      typeof completion.kindModifiers === 'string' &&
      completion.kindModifiers.split(',').includes('deprecated')
    ) {
      className.push('rehype-twoslash-completion-deprecated')
    }

    items.push({
      type: 'element',
      tagName: 'li',
      properties: {className},
      children
    })
  }

  return {
    content: [
      {
        type: 'element',
        tagName: 'span',
        properties: {
          className: [
            'rehype-twoslash-autoshow',
            'rehype-twoslash-completion-swap',
            'rehype-twoslash-popover-target'
          ],
          dataPopoverTarget: id
        },
        children: between
      }
    ],
    footer: [
      {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['rehype-twoslash-completion', 'rehype-twoslash-popover'],
          id,
          popover: ''
        },
        children: [
          {
            type: 'element',
            tagName: 'ol',
            properties: {className: ['rehype-twoslash-completions']},
            children: items
          }
        ]
      }
    ]
  }
}

/**
 * @param {State} state
 * @param {NodeError} annotation
 * @param {Array<ElementContent>} between
 * @returns {RenderResult}
 * @satisfies {Render<NodeError>}
 */
export function error(state, annotation, between) {
  const id = state.idPrefix + ++state.count

  return {
    content: [
      {
        type: 'element',
        tagName: 'span',
        properties: {
          className: [
            'rehype-twoslash-error-target',
            'rehype-twoslash-popover-target'
          ],
          dataPopoverTarget: id
        },
        children: between
      }
    ],
    footer: [
      {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['rehype-twoslash-error', 'rehype-twoslash-popover'],
          id,
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
                properties: {},
                children: [
                  {
                    type: 'text',
                    value:
                      annotation.text +
                      /* c8 ignore next -- errors we get back currently always have a code */
                      (annotation.code ? ' (' + annotation.code + ')' : '')
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}

/**
 * @param {State} state
 * @param {NodeHighlight} annotation
 * @param {Array<ElementContent>} between
 * @returns {Array<ElementContent>}
 * @satisfies {Render<NodeHighlight>}
 */
export function highlight(state, annotation, between) {
  return [
    {
      type: 'element',
      tagName: 'span',
      properties: {className: ['rehype-twoslash-highlight']},
      children: between
    }
  ]
}

/**
 * @param {State} state
 * @param {NodeHover} annotation
 * @param {Array<ElementContent>} between
 * @returns {RenderResult}
 * @satisfies {Render<NodeHover>}
 */
export function hover(state, annotation, between) {
  const id = state.idPrefix + ++state.count

  return {
    content: [
      {
        type: 'element',
        tagName: 'span',
        properties: {
          className: ['rehype-twoslash-popover-target'],
          dataPopoverTarget: id
        },
        children: between
      }
    ],
    footer: [
      {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['rehype-twoslash-hover', 'rehype-twoslash-popover'],
          id,
          popover: ''
        },
        children: createInfo(state, annotation)
      }
    ]
  }
}

/**
 * @param {State} state
 * @param {NodeQuery} annotation
 * @param {Array<ElementContent>} between
 * @returns {RenderResult}
 * @satisfies {Render<NodeQuery>}
 */
export function query(state, annotation, between) {
  const id = state.idPrefix + ++state.count

  return {
    content: [
      {
        type: 'element',
        tagName: 'span',
        properties: {
          className: [
            'rehype-twoslash-autoshow',
            'rehype-twoslash-popover-target'
          ],
          dataPopoverTarget: id
        },
        children: between
      }
    ],
    footer: [
      {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['rehype-twoslash-popover', 'rehype-twoslash-query'],
          id,
          popover: ''
        },
        children: createInfo(state, annotation)
      }
    ]
  }
}

/**
 * @param {State} state
 * @param {NodeHover | NodeQuery} annotation
 * @returns {Array<ElementContent>}
 */
function createInfo(state, annotation) {
  /** @type {Root} */
  const tree = annotation.docs
    ? fromMarkdown(annotation.docs, {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()]
      })
    : {type: 'root', children: []}
  const tags = annotation.tags || []
  /** @type {List} */
  const list = {type: 'list', spread: false, ordered: false, children: []}

  removePosition(tree, {force: true})

  for (const [name, text] of tags) {
    // Idea: support `{@link}` stuff.
    //
    // Use a `\n` here to join so that it’ll work when it is fenced code for
    // example.
    const value = '**@' + name + '**' + (text ? '\n' + text : '')
    const fragment = fromMarkdown(value, {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()]
    })
    removePosition(fragment, {force: true})

    list.children.push({
      type: 'listItem',
      spread: false,
      children: /** @type {Array<BlockContent | DefinitionContent>} */ (
        fragment.children
      )
    })
  }

  if (list.children.length > 0) {
    tree.children.push(list)
  }

  const hastTree = toHast(tree)
  assert(hastTree.type === 'root')

  visitParents(hastTree, 'element', function (node) {
    if (node.tagName !== 'pre') return
    const head = node.children[0]
    /* c8 ignore next -- we work with plain markdown here, so the `pre` always contains `code`. */
    if (!head || head.type !== 'element' || head.tagName !== 'code') return SKIP
    const classes = head.properties.className
    /* c8 ignore next -- type docs we get back currently always have a language. */
    if (!Array.isArray(classes)) return SKIP

    // Cast as we check if it’s a string in `find`.
    const language = /** @type {string | undefined} */ (
      classes.find(function (d) {
        return typeof d === 'string' && d.startsWith(prefix)
      })
    )

    const scope = language
      ? state.starryNight.flagToScope(language.slice(prefix.length))
      : /* c8 ignore next -- type docs we get back currently always have a language we know. */
        undefined

    if (!scope) return SKIP

    const fragment = state.starryNight.highlight(toString(head), scope)

    head.children = /** @type {Array<ElementContent>} */ (fragment.children)

    return SKIP
  })

  /** @type {Array<ElementContent>} */
  const result = [
    {
      type: 'element',
      tagName: 'pre',
      properties: {className: ['rehype-twoslash-popover-code']},
      children: [
        {
          type: 'element',
          tagName: 'code',
          properties: {className: ['language-ts']},
          children: /** @type {Array<ElementContent>} */ (
            state.starryNight.highlight(annotation.text, 'source.ts').children
          )
        }
      ]
    }
  ]

  if (hastTree.children.length > 0) {
    result.push({
      type: 'element',
      tagName: 'div',
      properties: {className: ['rehype-twoslash-popover-description']},
      children: /** @type {Array<ElementContent>} */ (hastTree.children)
    })
  }

  return result
}
