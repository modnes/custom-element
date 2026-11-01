import { expect } from "chai";
import CustomElement, { SetInjectable } from "../custom-element.js";

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

  describe("addInjectable", () => {
    it("should register an injectable without throwing", () => {
      const el = createTestElement();
      expect(() => el.addInjectable("service", "service")).to.not.throw();
    });

    it("should support registering multiple injectables", () => {
      const el = createTestElement();
      expect(() => {
        el.addInjectable("service-a", "serviceA");
        el.addInjectable("service-b", "serviceB");
      }).to.not.throw();
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

    it("should dispatch request-provider for each registered injectable on connect", () => {
      const el = createTestElement();
      const dispatched = [];

      el.addInjectable("dep-a", "depA");
      el.addInjectable("dep-b", "depB");

      document.addEventListener("request-provider", (e) => {
        dispatched.push(e.detail.name);
      });

      document.body.appendChild(el);

      expect(dispatched).to.include("dep-a");
      expect(dispatched).to.include("dep-b");
    });

    it("should inject the dependency into the declared property via event detail", () => {
      const el = createTestElement();
      const fakeService = { call: () => "ok" };

      el.addInjectable("my-service", "myService");

      document.addEventListener("request-provider", (e) => {
        if (e.detail.name === "my-service") {
          e.stopPropagation();
          e.detail.inject(fakeService);
        }
      });

      document.body.appendChild(el);

      expect(el.myService).to.equal(fakeService);
    });

    it("should dispatch request-provider events before rendering", () => {
      const order = [];
      const el = createTestElement();

      el.addInjectable("timing-dep", "timingDep");
      el.template = () => {
        order.push("render");
        return "<p></p>";
      };

      document.addEventListener("request-provider", (e) => {
        if (e.detail.name === "timing-dep") {
          order.push("inject");
          e.detail.inject("value");
        }
      });

      document.body.appendChild(el);

      expect(order).to.deep.equal(["inject", "render"]);
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

  describe("SetInjectable", () => {
    it("should inject the dependency into a component property when connected", () => {
      const el = createTestElement();
      const fakeRepo = { find: () => [] };

      el.addInjectable("repo", "repo");
      SetInjectable("repo", fakeRepo);

      document.body.appendChild(el);

      expect(el.repo).to.equal(fakeRepo);
    });

    it("should use document as default target", () => {
      const el = createTestElement();
      const fakeLogger = { log: () => {} };

      el.addInjectable("logger", "logger");
      SetInjectable("logger", fakeLogger);

      document.body.appendChild(el);

      expect(el.logger).to.equal(fakeLogger);
    });

    it("should accept a custom target element as provider", () => {
      const provider = document.createElement("div");
      document.body.appendChild(provider);

      const el = createTestElement();
      const fakeStore = { get: () => null };

      el.addInjectable("store", "store");
      SetInjectable("store", fakeStore, provider);

      provider.appendChild(el);

      expect(el.store).to.equal(fakeStore);
    });

    it("should not inject into unrelated injectables", () => {
      const el = createTestElement();

      el.addInjectable("target-dep", "targetDep");
      SetInjectable("other-dep", { unrelated: true });

      document.body.appendChild(el);

      expect(el.targetDep).to.be.undefined;
    });

    it("should stop propagation so ancestor providers do not also inject", () => {
      const innerProvider = document.createElement("div");
      document.body.appendChild(innerProvider);

      const el = createTestElement();
      const innerValue = { source: "inner" };
      const outerValue = { source: "outer" };

      el.addInjectable("scoped-dep", "scopedDep");
      SetInjectable("scoped-dep", outerValue, document.body);
      SetInjectable("scoped-dep", innerValue, innerProvider);

      innerProvider.appendChild(el);

      expect(el.scopedDep).to.equal(innerValue);
    });
  });
});
