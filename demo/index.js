/* eslint-disable unicorn/prefer-query-selector */
/* eslint-env browser */
/// <reference lib="dom" />

// @ts-ignore -- types aren’t inferred in VS Code for me.
import {computePosition, shift} from 'https://esm.sh/@floating-ui/dom@1'

const popoverTargets = /** @type {Array<HTMLElement>} */ (
  Array.from(document.querySelectorAll('.rehype-twoslash-popover-target'))
)

for (const popoverTarget of popoverTargets) {
  /** @type {NodeJS.Timeout | number} */
  let timeout = 0

  popoverTarget.addEventListener('click', function () {
    show(popoverTarget)
  })

  popoverTarget.addEventListener('mouseenter', function () {
    clearTimeout(timeout)
    timeout = setTimeout(function () {
      show(popoverTarget)
    }, 300)
  })

  popoverTarget.addEventListener('mouseleave', function () {
    clearTimeout(timeout)
  })

  if (popoverTarget.classList.contains('rehype-twoslash-autoshow')) {
    show(popoverTarget)
  }
}

/**
 * @param {HTMLElement} popoverTarget
 */
function show(popoverTarget) {
  const id = popoverTarget.dataset.popoverTarget
  if (!id) return
  const popover = document.getElementById(id)
  if (!popover) return

  popover.showPopover()

  computePosition(popoverTarget, popover, {
    placement: 'bottom',
    middleware: [shift({padding: 5})]
  }).then(
    /**
     * @param {{x: number, y: number}} value
     */
    function (value) {
      popover.style.left = value.x + 'px'
      popover.style.top = value.y + 'px'
    }
  )
}
