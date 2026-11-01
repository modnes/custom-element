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
 * @property {(string|function)}  template    Element HTML content
 * @property {object}             data        Element data
 */
export default class CustomElement extends HTMLElement {
  #injectables = [];

  constructor() {
    super();
    this.template = "";
    this.data = {};

    this.addEventListener("elementRendered", this.init.bind(this));
  }

  /**
   * Registers a dependency to be resolved via DOM event bubbling when the
   * element is connected to the document. A provider ancestor must listen for
   * the `request-provider` event and fulfill the request by calling the
   * callback supplied in `event.detail.inject`.
   * @param {string} name - The key that identifies the dependency.
   * @param {string} property - Name of the instance property that will receive the resolved dependency.
   */
  addInjectable(name, property) {
    this.#injectables.push({ name, property });
  }

  /**
   * Invoked each time the custom element is appended into a document-connected
   * element. This will happen each time the node is moved, and may happen
   * before the element's contents have been fully parsed.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements}
   * @fires CustomEvent#request-provider
   */
  connectedCallback() {
    for (const { name, property } of this.#injectables) {
      this.dispatchEvent(
        new CustomEvent("request-provider", {
          bubbles: true,
          composed: true,
          detail: {
            name,
            inject: (value) => {
              this[property] = value;
            },
          },
        }),
      );
    }

    this.render();
  }

  /**
   * Inserts the Element HTML content
   * @fires CustomEvent#elementRendered
   */
  render() {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    if (typeof this.template === "function") {
      this.insertAdjacentHTML("beforeEnd", this.template(this.data));
    } else {
      this.insertAdjacentHTML("beforeEnd", this.template);
    }

    this.dispatchEvent(new CustomEvent("elementRendered"));
  }

  /**
   * Invoked each time the element is rendered.
   */
  init() {}
}

/**
 * Registers a dependency provider on a target element (or the document).
 * When a descendant fires a `request-provider` event matching `name`, the
 * provider intercepts it, stops its propagation, and injects `value` by
 * calling `event.detail.inject`.
 * @param {string} name - The key that identifies the dependency to provide.
 * @param {*} value - The dependency value to inject.
 * @param {EventTarget} [target=document] - The element that acts as provider.
 */
export function SetInjectable(name, value, target = document) {
  target.addEventListener("request-provider", (event) => {
    if (event.detail.name === name) {
      event.stopPropagation();
      event.detail.inject(value);
    }
  });
}
