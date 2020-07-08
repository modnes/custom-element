/* global HTMLElement, CustomEvent */

export default class CustomElement extends HTMLElement {
  constructor () {
    super()
    this.template = ''
    this.data = {}

    this.addEventListener('elementRendered', this.init.bind(this))
  }

  connectedCallback () {
    this.render()
  }

  render () {
    while (this.firstChild) {
      this.removeChild(this.firstChild)
    }

    if (typeof this.template === 'function') {
      this.insertAdjacentHTML('beforeEnd', this.template(this.data))
    } else {
      this.insertAdjacentHTML('beforeEnd', this.template)
    }

    this.dispatchEvent(new CustomEvent('elementRendered'))
  }

  init () {}
}
