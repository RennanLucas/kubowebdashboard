import "@testing-library/jest-dom";

// Only stub matchMedia in DOM-backed environments (jsdom). Test files that opt
// into the node environment (e.g. pure-logic suites) have no `window`.
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}
