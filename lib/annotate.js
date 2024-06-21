/**
 * @import {ElementContent, Element, Root} from 'hast'
 * @import {TwoslashNode} from 'twoslash'
 * @import {MatchText, MatchParent, State, RenderResult} from './types.js'
 */

import {ok as assert} from 'devlop'
import {EXIT, visitParents} from 'unist-util-visit-parents'

/**
 * @param {Root} tree
 *   Tree.
 * @param {TwoslashNode} annotation
 *   Annotation.
 * @param {State} state
 *   Info pased around.
 * @returns {Array<ElementContent>}
 *   Extra content for footer.
 */
export function annotate(tree, annotation, state) {
  /** @type {Array<ElementContent>} */
  const allFooter = []
  const matches = normalizeMatches(findMatches(tree, annotation))

  let match = matches.pop()
  while (match) {
    const parent = match.stack.at(-1)
    assert(parent)

    /** @type {Array<ElementContent>} */
    const before =
      'value' in parent && match.range[0] !== 0
        ? [{type: 'text', value: parent.value.slice(0, match.range[0])}]
        : []
    /** @type {Array<ElementContent>} */
    const between =
      'value' in parent
        ? [
            {
              type: 'text',
              value: parent.value.slice(match.range[0], match.range[1])
            }
          ]
        : // Cast because we never have comments.
          /** @type {Array<ElementContent>} */ (
            parent.children.slice(match.range[0], match.range[1])
          )
    /** @type {Array<ElementContent>} */
    const after =
      'value' in parent && match.range[1] !== parent.value.length
        ? [{type: 'text', value: parent.value.slice(match.range[1])}]
        : []

    const renderResult = render(state, annotation, between)

    /** @type {Array<ElementContent>} */
    const allContent = [...before]

    if (renderResult.content) {
      allContent.push(...renderResult.content)
    }

    if (renderResult.footer) {
      allFooter.push({type: 'text', value: '\n'}, ...renderResult.footer)
    }

    allContent.push(...after)

    if (parent.type === 'text') {
      const grandParent = match.stack.at(-2)
      assert(grandParent)
      assert('children' in grandParent)
      grandParent.children.splice(
        grandParent.children.indexOf(parent),
        1,
        ...allContent
      )
    } else {
      parent.children.splice(
        match.range[0],
        match.range[1] - match.range[0],
        ...allContent
      )
    }

    match = matches.pop()
  }

  return allFooter
}

/**
 * @param {Root} tree
 * @param {TwoslashNode} annotation
 * @returns {Array<MatchText>}
 */
function findMatches(tree, annotation) {
  let nodeStart = 0
  const annotationStart = annotation.start
  const annotationEnd =
    // Use a single character for empty annotations.
    annotationStart + (annotation.length === 0 ? 1 : annotation.length)
  /** @type {Array<MatchText>} */
  const matches = []

  visitParents(tree, 'text', function (node, stack_) {
    const stack = /** @type {[Root, ...Array<Element>]} */ (stack_)
    const nodeEnd = nodeStart + node.value.length

    if (annotationStart < nodeEnd && annotationEnd > nodeStart) {
      matches.push({
        node,
        stack,
        range: [
          Math.max(annotationStart - nodeStart, 0),
          Math.min(annotationEnd - nodeStart, node.value.length)
        ]
      })
    }

    // Done if we’re past the annotation.
    if (nodeEnd > annotationEnd) {
      return EXIT
    }

    nodeStart = nodeEnd
  })

  return matches
}

/**
 * @param {ReadonlyArray<MatchText>} matches
 * @returns {Array<MatchParent>}
 */
function normalizeMatches(matches) {
  /** @type {Array<MatchParent>} */
  const result = []

  for (const match_ of matches) {
    /** @type {MatchParent} */
    let match = {stack: [...match_.stack, match_.node], range: match_.range}
    let node = match.stack.at(-1)

    while (
      node &&
      node.type !== 'root' &&
      match.range[0] === 0 &&
      ('children' in node
        ? match.range[1] === node.children.length
        : match.range[1] === node.value.length)
    ) {
      // Cannot be `text`.
      const nextStack = /** @type {[Root, ...Array<Element>]} */ (
        match.stack.slice(0, -1)
      )
      // Cannot be undefined either (as it’s not a `root`).
      const nextNode = nextStack.at(-1)
      assert(nextNode)
      const position = nextNode.children.indexOf(node)
      match = {
        range: [position, position + 1],
        stack: nextStack
      }
      node = nextNode
    }

    // See if we can merge:
    const previous = result.at(-1)
    const previousParent = previous ? previous.stack.at(-1) : undefined
    const parent = match.stack.at(-1)

    if (previous && previousParent && parent === previousParent) {
      previous.range[1] = match.range[1]
    } else {
      result.push(match)
    }
  }

  return result
}

/**
 * @param {State} state
 * @param {TwoslashNode} annotation
 * @param {Array<ElementContent>} between
 * @returns {RenderResult}
 */
function render(state, annotation, between) {
  assert(annotation.type !== 'tag') // Seems to never happen.
  // @ts-expect-error: renderer matches annotation.
  const result = state.renderers[annotation.type](state, annotation, between)
  return Array.isArray(result) ? {content: result, footer: undefined} : result
}
