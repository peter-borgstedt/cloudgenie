type Node = {
  parent: Node;
  key: string;
  value: string | number | object;
  type: string;
  index?: number;
}

type Predicate = (node: Node) => boolean;

/** A none recursive iterator to avoid stack overflow */
export function iterator(obj: object, predicate: Predicate): void {
  const root: Node = { parent: null, key: '', value: obj, type: 'object' };

  const nodes: Node[] = Object.entries(obj).map(([ key, value ]) => ({
    parent: root, key, value, type: 'object'
  }))

  while (nodes.length) {
    const current = nodes.pop()
    const { key, value } = current;

    if (value instanceof Object && Object === value.constructor) {
      nodes.push(... Object.entries(value).map(([ key, value ]) => ({
        parent: current, key, value, type: 'object'
      })))
    } else if (Array.isArray(value)) {
      nodes.push(... value.map((value, index) => ({
        parent: current, key, value, type: 'array', index
      })));
    } else {
      predicate(current);
    }
  }
}