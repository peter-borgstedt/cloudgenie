import SCHEMA from '@common/cfschema';
import fs from 'fs';
import { iterator } from '@common/utilities';
import { merge } from 'lodash'
import { parse } from './config/cloudformaton';
import yaml from 'js-yaml';

interface CloudFormationYaml {
  Globals: {
    [ key: string ]: any;
  };
  Resources: {
    [ key: string ]: {
      Type: string;
      Properties: any;
    };
  };
}

const POST_PROCESSING = /(?:['"]?<AWS\s(![a-zA-Z]+\s[^#>]+)\/>['"]?)/g

const extract = <T>(obj: { [ key: string ]: string }, keyName = 'Key', valueName = 'Value'): T[] => {
  return Object.entries(obj)
    .map(([ key, value ]) => {
      const v = {};
      v[keyName] = key;
      v[valueName] = value;
      return v as T
    })
}

/*
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
*/

const replacement = (yamlObj) => {
  // Property replacement and retrival
  iterator(yamlObj, ({ parent, key, value }): boolean => {
    return false;
  });
}

export const parseStackParameters = (stackParameters: CloudGenie.Types.Stack): CloudGenie.Types.StackParameters => {
  const { name, bucket, bucketPrefix, parameters, tags, resources } = stackParameters
  const yamlFiles = resources
    .map((filePath) => {
      return { filePath, data: fs.readFileSync(filePath, 'utf8')}
    });

  const context = {};

  const obj = {};
  for (const { filePath, data } of yamlFiles) {
    const yamlObj = yaml.load(data, { schema: SCHEMA })

    replacement(yamlObj);

    const { Resources, Globals = {} } = yamlObj as CloudFormationYaml
/*
    if (Globals) {
      for (const resource of Object.values(Resources)) {
        if (resource.Type) {
          const type = resource.Type.toLowerCase();
          parseResources(type, resource, context)
        }
      }
    }
*/
    if (Resources) {
      for (const resource of Object.values(Resources)) {
        if (resource.Type) {
          const type = resource.Type.split('::').pop().toLowerCase()
          const input = { bucket, bucketPrefix, filePath }
          const output = context[type] || (context[type] = {})
          parse(type, resource, input, output)
        }
      }
    }

    merge(obj, yamlObj);
  }

  return {
    name,
    template: { obj, str: yaml.dump(obj, { schema: SCHEMA }) },
    parameters: extract(parameters, 'ParameterKey', 'ParameterValue'),
    tags: extract(tags),
    resources
  }
}