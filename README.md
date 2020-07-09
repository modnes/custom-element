Custom Element Module
=====================

Custom Element Module helps on creation of new custom elements.

Installing
----------

    npm i @modnes/custom-element


Usage
-----

The CustomElement must be extended by your own class that can be used to define a new custom element.

```javascript
import CustomElement from 'path/to/@modnes/custom-element/custom-element.js'

class CustomExample extends CustomElement {
  /**
   * The constructor can be used to set a template as string or function.
   */
  constructor () {
    super()
    this.template = `
      <h1>Custom Example</h1>
      <button type="button">OK</button>
    `
  }

  /**
   * This method is called when the template is rendered.
   */
  init () {
    const BUTTON = this.querySelector('button')

    BUTTON.addEventListener('click', () => {
      alert('Custom Example!')
    })
  }
}

/**
 * This provides this tag to be used in HTML: <custom-example></custom-example>
 */
customElements.define('custom-example', CustomExample)

```

You can set some data using de `data` property that is passed when the template is a function that returns the HTML content.

```javascript
import CustomElement from 'path/to/@modnes/custom-element/custom-element.js'

class DataExample extends CustomElement {
  constructor () {
    super()
    /**
     * this.data is passed to the template function
     */
    this.template = data => `
      <h1>${data.title}</h1>
      <p>${data.text}</p>
    `
  }

  async connectedCallback () {
    const FETCH_RESULT = await fetch('path/to/data.json')
    this.data = await FETCH_RESULT.json()

    // You can call super.connectedCallback() or this.render()
    super.connectedCallback()
  }
}

/**
 * This provides this tag to be used in HTML: <data-example></data-example>
 */
customElements.define('data-example', DataExample)

```

See the [API documentation](https://github.com/modnes/custom-element/wiki/API)
