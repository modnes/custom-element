/* global CustomEvent, HTMLElement */

/**
 * modnes Custom Element
 * @module modnes/custom-element
 * @author Luiz Henrique Canet Filho <me@luizca.net>
 */

/**
 * The built in custom event object.
 * @external CustomEvent
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent|CustomEvent}
 */

/**
 * CustomElement
 * @property {(string|function)}  template  Element HTML content
 * @property {object}             data      Element data
 */
export default class CustomElement extends HTMLElement {
  constructor () {
    super()
    this.template = ''
    this.data = {}

    this.addEventListener('elementRendered', this.init.bind(this))
  }

  /**
   * Invoked each time the custom element is appended into a document-connected
   * element. This will happen each time the node is moved, and may happen
   * before the element's contents have been fully parsed.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements}
   */
  connectedCallback () {
    this.render()
  }

  /**
   * Inserts the Element HTML content
   * @fires CustomEvent#elementRendered
   */
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

  /**
   * Invoked each time the element is rendered.
   */
  init () {}
}
