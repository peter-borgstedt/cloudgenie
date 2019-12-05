import _ from 'lodash';
import yaml from 'js-yaml';

type Kind = 'sequence' | 'scalar' | 'mapping' | null;

const FUNCTION_NAME = [
  'And',
  'Base64',
  'Cidr',
  'Condition',
  'Equals',
  'FindInMap',
  'GetAtt',
  'GetAZs',
  'If',
  'ImportValue',
  'Join',
  'Not',
  'Or',
  'Ref',
  'Select',
  'Split',
  'Sub',
];

const KINDS: Kind[] = [
  'mapping',
  'scalar',
  'sequence'
];

const yamlType = (name: string, kind: Kind): yaml.Type => {
  const functionName = ['Ref', 'Condition'].includes(name) ? name : `Fn::${name}`;

  return new yaml.Type(`!${name}`, {
    kind,
    construct: (data): object => {
      if (name === 'GetAtt') {
        // Special GetAtt dot syntax
        if (typeof data === 'string') {
          const [ first, ...tail ] = data.split('.');
          data = [ first, tail.join('.') ];
        }
      }
      return { [functionName]: data };
    },
  });
};

const createSchema = (): yaml.Schema => {
  const types = FUNCTION_NAME
    .map(functionName => KINDS.map(kind => yamlType(functionName, kind)))
    .flat()
  return yaml.Schema.create(types);
};

export default createSchema();
