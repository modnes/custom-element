import { expect } from "chai";
import CustomElement from "../custom-element.js";

if (typeof customElements === "undefined" && typeof window !== "undefined") {
  globalThis.customElements = window.customElements;
}

const BASE_TAG_NAME = "base-custom-element";
window.customElements.define(BASE_TAG_NAME, CustomElement);

describe("CustomElement", () => {
  let elementCount = 0;

  function createTestElement(subclass = null) {
    if (!subclass) {
      return document.createElement(BASE_TAG_NAME);
    }
    const tagName = `test-sub-element-${++elementCount}`;
    window.customElements.define(tagName, subclass);
    return document.createElement(tagName);
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("constructor", () => {
    it("should initialize template as an empty string", () => {
      const el = createTestElement();
      expect(el.template).to.equal("");
    });

    it("should initialize data as an empty object", () => {
      const el = createTestElement();
      expect(el.data).to.deep.equal({});
    });

    it("should be an instance of HTMLElement and CustomElement", () => {
      const el = createTestElement();
      expect(el).to.be.an.instanceOf(HTMLElement);
      expect(el).to.be.an.instanceOf(CustomElement);
    });
  });

  describe("connectedCallback", () => {
    it("should call render when element is connected to the DOM", () => {
      const el = createTestElement();
      el.template = "<p>Connected Content</p>";

      expect(el.innerHTML).to.equal("");
      document.body.appendChild(el);
      expect(el.innerHTML).to.equal("<p>Connected Content</p>");
    });
  });

  describe("render", () => {
    it("should render string template into element", () => {
      const el = createTestElement();
      el.template = "<div>Static Content</div>";
      el.render();

      expect(el.innerHTML).to.equal("<div>Static Content</div>");
    });

    it("should render functional template with element data", () => {
      const el = createTestElement();
      el.data = { name: "World", count: 42 };
      el.template = (data) =>
        `<span>Hello ${data.name}! Count: ${data.count}</span>`;
      el.render();

      expect(el.innerHTML).to.equal("<span>Hello World! Count: 42</span>");
    });

    it("should pass data directly to functional template", () => {
      const el = createTestElement();
      let receivedData = null;
      el.data = { foo: "bar" };
      el.template = (data) => {
        receivedData = data;
        return "<p>ok</p>";
      };
      el.render();

      expect(receivedData).to.equal(el.data);
      expect(receivedData).to.deep.equal({ foo: "bar" });
    });

    it("should clear existing children before rendering", () => {
      const el = createTestElement();
      el.template = "<p>Initial</p>";
      el.render();
      expect(el.children.length).to.equal(1);
      expect(el.innerHTML).to.equal("<p>Initial</p>");

      el.template = "<p>Updated 1</p><p>Updated 2</p>";
      el.render();
      expect(el.children.length).to.equal(2);
      expect(el.innerHTML).to.equal("<p>Updated 1</p><p>Updated 2</p>");
    });

    it("should remove any pre-existing child nodes", () => {
      const el = createTestElement();
      const span = document.createElement("span");
      span.textContent = "pre-existing";
      el.appendChild(span);
      expect(el.children.length).to.equal(1);

      el.template = "<div>New Child</div>";
      el.render();
      expect(el.children.length).to.equal(1);
      expect(el.querySelector("span")).to.be.null;
      expect(el.querySelector("div").textContent).to.equal("New Child");
    });

    it("should dispatch elementRendered event", (done) => {
      const el = createTestElement();
      el.addEventListener("elementRendered", (event) => {
        expect(event).to.be.an.instanceOf(CustomEvent);
        expect(event.type).to.equal("elementRendered");
        done();
      });

      el.render();
    });

    it("should handle default empty string template without errors", () => {
      const el = createTestElement();
      expect(() => el.render()).to.not.throw();
      expect(el.innerHTML).to.equal("");
    });
  });

  describe("init", () => {
    it("should provide a default no-op init method that does not throw", () => {
      const el = createTestElement();
      expect(() => el.init()).to.not.throw();
    });

    it("should automatically invoke init upon render via elementRendered event", () => {
      let initCalled = false;
      class SubElement extends CustomElement {
        init() {
          super.init();
          initCalled = true;
        }
      }

      const el = createTestElement(SubElement);
      expect(initCalled).to.be.false;

      el.render();
      expect(initCalled).to.be.true;
    });

    it("should bind this to the element instance inside init", () => {
      let capturedThis = null;
      let capturedEvent = null;

      class SubElement extends CustomElement {
        init(event) {
          capturedThis = this;
          capturedEvent = event;
        }
      }

      const el = createTestElement(SubElement);
      el.render();

      expect(capturedThis).to.equal(el);
      expect(capturedEvent).to.be.an.instanceOf(CustomEvent);
      expect(capturedEvent.type).to.equal("elementRendered");
    });
  });
});
