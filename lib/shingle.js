import {unicodePunctuation, unicodeWhitespace} from 'micromark-util-character'

/**
 * @param {string} value
 *   Value.
 * @param {Map<string, number>} counts
 *   Counts.
 * @returns {string}
 *   Hash.
 */
export function smallShingleHash(value, counts) {
  let hash = smallShingle(value)
  let count = counts.get(hash)

  if (count === undefined) {
    count = 0
  } else {
    count++
  }

  counts.set(hash, count)
  if (count) hash += '-' + count
  return hash
}

/**
 * @param {string} value
 *   Value.
 * @returns {string}
 *   Hash.
 */
function smallShingle(value) {
  const size = 4
  /** @type {Array<string>} */
  const firstLettersOfFirstWords = []
  /** @type {Array<string>} */
  const firstLettersOfLastWords = []
  let index = -1
  /** @type {boolean | undefined} */
  let atWord = true

  while (++index < value.length) {
    const code = value.charCodeAt(index)

    if (unicodePunctuation(code)) {
      // Empty.
    } else if (unicodeWhitespace(code)) {
      atWord = true
    } else if (atWord) {
      firstLettersOfFirstWords.push(String.fromCharCode(code))
      if (firstLettersOfFirstWords.length >= size) break
      atWord = false
    } else {
      // Ignore other letters.
    }
  }

  index = value.length
  atWord = true
  /** @type {number | undefined} */
  let lastLetterCode

  while (index--) {
    const code = value.charCodeAt(index)

    if (unicodePunctuation(code)) {
      // Empty.
    } else if (unicodeWhitespace(code)) {
      if (lastLetterCode) {
        firstLettersOfLastWords.push(String.fromCharCode(lastLetterCode))
        lastLetterCode = undefined
        if (firstLettersOfLastWords.length >= size) break
      }
    } else {
      lastLetterCode = code
    }
  }

  if (lastLetterCode) {
    firstLettersOfLastWords.push(String.fromCharCode(lastLetterCode))
  }

  firstLettersOfLastWords.reverse()

  return firstLettersOfFirstWords.join('') + firstLettersOfLastWords.join('')
}
