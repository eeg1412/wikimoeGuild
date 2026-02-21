class Node {
  constructor() {
    this.children = new Map()
    this.fail = null
    this.outputs = []
  }
}

export default class SensitiveFilter {
  constructor(words = [], options = {}) {
    if (!Array.isArray(words)) {
      throw new Error('SensitiveFilter: words must be an array')
    }

    this.ignoreCase = options.ignoreCase ?? true
    this.skipSymbols = options.skipSymbols ?? false

    this._build(words)
  }

  normalizeChar(char) {
    return this.ignoreCase ? char.toLowerCase() : char
  }

  isSymbol(char) {
    return /[\p{P}\p{S}\s]/u.test(char)
  }

  _build(words) {
    this.root = new Node()

    // 1. 构建 Trie
    for (const word of words) {
      if (!word) continue

      let node = this.root
      for (let char of [...word]) {
        char = this.normalizeChar(char)
        if (!node.children.has(char)) {
          node.children.set(char, new Node())
        }
        node = node.children.get(char)
      }
      node.outputs.push(word)
    }

    // 2. 构建 fail 指针
    const queue = []
    this.root.fail = this.root

    for (const node of this.root.children.values()) {
      node.fail = this.root
      queue.push(node)
    }

    while (queue.length) {
      const current = queue.shift()

      for (const [char, child] of current.children) {
        let failNode = current.fail

        while (failNode !== this.root && !failNode.children.has(char)) {
          failNode = failNode.fail
        }

        child.fail = failNode.children.get(char) || this.root
        child.outputs = child.outputs.concat(child.fail.outputs)

        queue.push(child)
      }
    }
  }

  reload(words = []) {
    if (!Array.isArray(words)) {
      throw new Error('SensitiveFilter.reload: words must be an array')
    }
    this._build(words)
  }

  _process(text) {
    const results = []
    let node = this.root

    const original = [...text]
    const normalized = original.map(c => this.normalizeChar(c))

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i]

      if (this.skipSymbols && this.isSymbol(char)) {
        continue
      }

      while (node !== this.root && !node.children.has(char)) {
        node = node.fail
      }

      if (node.children.has(char)) {
        node = node.children.get(char)
      }

      if (node.outputs.length) {
        for (const word of node.outputs) {
          results.push({
            word,
            index: i - word.length + 1
          })
        }
      }
    }

    return results
  }

  contains(text) {
    return this._process(text).length > 0
  }

  find(text) {
    return this._process(text)
  }

  replace(text, mask = '*') {
    const matches = this._process(text)
    if (!matches.length) return text

    const chars = [...text]

    for (const { word, index } of matches) {
      for (let i = 0; i < word.length; i++) {
        if (chars[index + i] !== undefined) {
          chars[index + i] = mask
        }
      }
    }

    return chars.join('')
  }
}
