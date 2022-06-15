export async function querySelectorWait<E extends Element>(selector: string, { delay = 200 } = {}): Promise<E> {
  let element: E = document.querySelector(selector);
  while (!element) {
    await new Promise(resolve => setTimeout(resolve, delay));
    element = document.querySelector(selector);
  }

  return element;
}

export async function querySelectorAllWait<E extends Element>(selector: string, { delay = 200, timeout = 5000 } = {}) {
  let elements: NodeListOf<E> = document.querySelectorAll(selector);
  let reachedTimeout = false;

  setTimeout(() => {
    reachedTimeout = true;
  }, timeout);

  while (!elements.length) {
    if (reachedTimeout) {
      console.log('querySelectorAllWait timeout');
      break;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    elements = document.querySelectorAll(selector);
  }

  return elements;
}