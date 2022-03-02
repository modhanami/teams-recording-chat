export async function querySelectorWait<E extends Element>(selector: string, { delay = 200 } = {}): Promise<E> {
  let element: E = document.querySelector(selector);
  while (!element) {
    await new Promise(resolve => setTimeout(resolve, delay));
    element = document.querySelector(selector);
  }

  return element;
}

export async function querySelectorAllWait<E extends Element>(selector:string, { delay = 200 } = {}) {
  let elements: NodeListOf<E> = document.querySelectorAll(selector);
  while (!elements.length) {
    await new Promise(resolve => setTimeout(resolve, delay));
    elements = document.querySelectorAll(selector);
  }

  return elements;
}