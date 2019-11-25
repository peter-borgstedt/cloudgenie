import * as fs from 'fs';
import { merge } from 'lodash'
import path from 'path'
import yaml from 'js-yaml';

const extract = <T>(obj: { [ key: string ]: string }, keyName = 'Key', valueName = 'Value'): T[] => {
  return Object.entries(obj)
    .map(([ key, value ]) => {
      const v = {};
      v[keyName] = key;
      v[valueName] = value;
      return v as T
    })
}

const SCHEMA = yaml.Schema.create(
  [],
  [
    new yaml.Type('!Sub', {
      kind: 'scalar',
      construct: (data: string): string => `<AWS !Sub ${data}/>`
    }),
    new yaml.Type('!Ref', {
      kind: 'scalar',
      construct: (data: string): string => `<AWS !Ref ${data}/>`,
    }),
    new yaml.Type('!GetAtt', {
      kind: 'scalar',
      construct: (data: string): string => `<AWS !GetAtt ${data}/>`,
    })
  ]
)

/** A none recursive iterator to avoid stack overflow */
function iterator(root: { [key: string]: any }, predicate): void {
  const node = [ ... Object.entries(root).map((entry) => ({ parent: root, entry })) ];

  while (node.length) {
    const { parent, entry } = node.pop()
    const [, value ] = entry;

    if(!predicate(parent, entry) && value instanceof Object && [Object, Array].includes(value.constructor)) {
      node.push(... Object.entries(value).map((entry) => ({ parent: value, entry})));
    }
  }
}

const composeTemplate = (yamlFiles: string[]): { load: object; dump: string } => {
  const merged = yamlFiles
    .map((filePath) => {
      return { filePath, data: fs.readFileSync(filePath, 'utf8')}
    })
    .reduce((obj, { filePath, data }) => {
      const content = yaml.load(data/*, { schema: SCHEMA }*/)

      // Preprocess the content and replace any paths and relates properties
      iterator(content, (parent, [ key, value ]) => {
        if (key == 'CodeUri' && value.constructor === String) {
          const absoluteFilePath = path.resolve(path.dirname(filePath), value);
          const relativeFilePath = path.relative(process.cwd(), absoluteFilePath);
          parent[key] = relativeFilePath;
          // console.log(absoluteFilePath, relativeFilePath);
        }
      });

      return merge(obj, content);
    }, {})

    return {
      dump: yaml.dump(merged/*, { schema: SCHEMA }*/)
      // Remove spaces for AWS related scalar types
      .replace(/(?:['"]?<AWS\s(![a-zA-Z]+\s[^#]*)\/>['"]?)/g, '$1'),
      load: merged
    };
}

export const parse = (stackParameters: CloudGenie.Types.Stack): CloudGenie.Types.StackParameters => {
  const { name, parameters, tags, resources } = stackParameters
  const template = composeTemplate(resources);

  // TODO: remove?
  fs.writeFileSync(`${process.cwd()}/template.yaml`, template, { encoding: 'UTF-8' });

  return {
    name,
    template: template.dump,
    templateRaw: template.load,
    parameters: extract(parameters, 'ParameterKey', 'ParameterValue'),
    tags: extract(tags),
  }
}