import type {Grammar, createStarryNight} from '@wooorm/starry-night'
import type {
  NodeCompletion,
  NodeError,
  NodeHighlight,
  NodeHover,
  NodeQuery,
  TwoslashOptions
} from 'twoslash'
import type {ElementContent, Element, Text, Root} from 'hast'

/**
 * Twoslash annotations (called nodes there) by their `type` field,
 * excluding `tag` (which I can’t reproduce).
 */
export interface AnnotationsMap {
  /**
   * Completion.
   */
  completion: NodeCompletion
  /**
   * Error.
   */
  error: NodeError
  /**
   * Highlight.
   */
  highlight: NodeHighlight
  /**
   * Hover.
   */
  hover: NodeHover
  /**
   * Query.
   */
  query: NodeQuery
}

/**
 * Match.
 */
export interface MatchText {
  /**
   * Node that includes match.
   */
  node: Text
  /**
   * Indices.
   */
  range: Range
  /**
   * Parents.
   */
  stack: [Root, ...Array<Element>]
}

/**
 * Match.
 */
export interface MatchParent {
  /**
   * Indices.
   */
  range: Range
  /**
   * Parents.
   */
  stack: [Root, ...Array<Element>, Text] | [Root, ...Array<Element>]
}

/**
 * Configuration for `rehype-twoslash`.
 *
 * ###### Notes
 *
 * `rehype-twoslash` runs on `<code>` elements with a `twoslash` directive.
 * That directive can be passed as a word in markdown (` ```ts twoslash `) or
 * as a class in HTML (`<code class="language-ts twoslash">`).
 *
 * The inverse occurs when `directive` is `false`.
 * All `<code>` where the language class is JavaScript or TypeScript is
 * processed.
 * Then `no-twoslash` (` ```ts no-twoslash `,
 * `<code class="language-ts no-twoslash">`) can be used to prevent processing.
 */
export interface Options {
  /**
   * Whether to require a `twoslash` directive (default: `true`).
   */
  directive?: boolean | null | undefined
  /**
   * Prefix before IDs (default: `'rehype-twoslash-'`).
   */
  idPrefix?: string | null | undefined
  /**
   * Grammars for `starry-night` to support (default:
   * `[sourceJson, sourceJs, sourceTsx, sourceTs]`).
   */
  grammars?: ReadonlyArray<Grammar> | null | undefined
  /**
   * Renderers for `twoslash` annotations (optional).
   */
  renderers?: Renderers | null | undefined
  /**
   * Options passed to `twoslash` (optional);
   * this includes fields such as `cache`,
   * `customTransformers`,
   * and `filterNode`;
   * see
   * [`TwoslashOptions` from `twoslash`](https://github.com/twoslashes/twoslash/blob/1eb3af3/packages/twoslash/src/types/options.ts#L18)
   * for more info.
   */
  twoslash?: TwoslashOptions | null | undefined
}

/**
 * Two indices.
 */
export type Range = [from: number, to: number]

/**
 * Render function.
 *
 * Takes a particular annotation from the TypeScript compiler (such as an error)
 * and turns it into `hast` (HTML) content.
 * See `lib/render.js` for examples.
 *
 * ###### Notes
 *
 * You can return `Array<ElementContent>` directly instead of a {@linkcode RenderResult}
 * when you don’t have content for a footer.
 *
 * @param state
 *   Current state.
 * @param annotation
 *   Annotation.
 * @param children
 *   Matched children.
 * @returns
 *   New children.
 */
export type Render<Annotation extends AnnotationsMap[keyof AnnotationsMap]> = (
  state: State,
  annotation: Annotation,
  children: Array<ElementContent>
) => Array<ElementContent> | RenderResult

/**
 * Result from {@linkcode Render}.
 */
export interface RenderResult {
  /**
   * Main inline content to use in the code block;
   * for example a `<span>` that causes a tooltip to show.
   */
  content?: Array<ElementContent> | undefined
  /**
   * Extra content to use that relates to the code block;
   * for example a `<div>` for a tooltip.
   */
  footer?: Array<ElementContent> | undefined
}

/**
 * Renderers.
 *
 * Each key is a type of an annotation (such as `error` or `hover`) and each
 * value a corresponding render function.
 */
export type Renderers = {
  [Type in keyof AnnotationsMap]?:
    | Render<AnnotationsMap[Type]>
    | null
    | undefined
}

/**
 * `starryNight` instance.
 */
type StarryNight = Awaited<ReturnType<typeof createStarryNight>>

/**
 * Info passed around.
 */
export interface State {
  /**
   * Current unique ID count.
   */
  count: number
  /**
   * Prefix for all IDs relating to this code block on this page.
   */
  idPrefix: string
  /**
   * Renderers.
   */
  renderers: {
    [Type in keyof AnnotationsMap]: Render<AnnotationsMap[Type]>
  }
  /**
   * Current `starryNight` instance.
   */
  starryNight: StarryNight
}
