import * as fs from 'fs';
import AWS, { CloudFormation } from 'aws-sdk';
import chalk from '@common/chalk'
import { merge } from 'lodash'
import { monitorEvents } from './monitoring';
import path from 'path'
import prettyjson from 'prettyjson'
import { renderEvent } from '@common/renderer';
import yaml from 'js-yaml';

type StackParameters = { name: string; template: string; templateRaw: object; parameters: CloudFormation.Parameter[]; tags: CloudFormation.Tag[] }

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

const extract = <T>(obj: { [ key: string ]: string }, keyName = 'Key', valueName = 'Value'): T[] => {
  return Object.entries(obj)
    .map(([ key, value ]) => {
      const v = {};
      v[keyName] = key;
      v[valueName] = value;
      return v as T
    })
}

const composeTemplate = (yamlFiles: string[]): { load: object, dump: string } => {
  const merged = yamlFiles
    .map((filePath) => {
      return { filePath, data: fs.readFileSync(filePath, 'utf8')}
    })
    .reduce((obj, { filePath, data }) => {
      const content = yaml.safeLoad(data, { schema: SCHEMA })

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
      dump: yaml.safeDump(merged, { schema: SCHEMA })
      // Remove spaces for AWS related scalar types
      .replace(/(?:['"]?<AWS\s(![a-zA-Z]+\s[^#]*)\/>['"]?)/g, '$1'),
      load: merged
    };
}

export const stackExists = async (cf: AWS.CloudFormation, stackName: string): Promise<boolean> => {
  try {
    await cf.describeStacks({ StackName: stackName }).promise();
    return true;
  } catch(error) {
    if (/does not exist$/.test(error.message)) {
      return false;
    }
    throw error;
  }
}

const getStackParams = (
  params: {
    name: string;
    parameters: AWS.CloudFormation.Parameter[];
    tags: AWS.CloudFormation.Tag[];
    template: string;
  }): {
    StackName: string;
    Capabilities: string[];
    Parameters: AWS.CloudFormation.Parameter[];
    Tags: AWS.CloudFormation.Tag[];
    TemplateBody: string;
  } => {
  const { name, parameters, tags, template } = params;
  return {
    StackName: name,
    Capabilities: [
      'CAPABILITY_IAM',
      'CAPABILITY_NAMED_IAM',
      'CAPABILITY_AUTO_EXPAND'
    ],
    Parameters: parameters,
    Tags: tags,
    TemplateBody: template
  };
}

export const validateStack = async (cf: AWS.CloudFormation, params: StackParameters): Promise<void> => {
  process.stdout.write(chalk.hex('777777')(`Cloudgenie: Validating template (${chalk.hex('BBBBBB')(params.name)})`))
  await cf.validateTemplate({ TemplateBody: params.template }).promise()
  console.log(` ${chalk.green('OK!')}`)
}

export const removeStack = async (cf: AWS.CloudFormation, params: StackParameters): Promise<void> => {
  console.log(chalk.hex('777777')(`Cloudgenie: Deleting Stack (${chalk.hex('BBBBBB')(params.name)})`))
  await cf.deleteStack({ StackName: params.name }).promise()
  console.log(chalk.hex('777777')(`Cloudgenie: Describe Stack Events (${chalk.hex('BBBBBB')(params.name)})`))
  await monitorEvents(cf, params.name, (event) => console.log(renderEvent(event)));
  console.log(chalk.hex('777777')(`Cloudgenie: Stack deletion (${chalk.hex('BBBBBB')(params.name)}) finished...`), )
}

export const createStack = async (cf: AWS.CloudFormation, params: StackParameters): Promise<void> => {
  console.log(chalk.hex('777777')(`Cloudgenie: Creating Stack (${chalk.hex('BBBBBB')(params.name)})...`))
  await cf.createStack(Object.assign(getStackParams(params), {
    OnFailure: "ROLLBACK",
    EnableTerminationProtection: false
  })).promise()
  console.log(chalk.hex('777777')(`Cloudgenie: Describe Stack Events (${chalk.hex('BBBBBB')(params.name)})`))
  await monitorEvents(cf, params.name, (event) => console.log(renderEvent(event)));
  console.log(chalk.hex('777777')(`Cloudgenie: Stack creation (${chalk.hex('BBBBBB')(params.name)}) finished...`), )
}

export const updateStack = async (cf: AWS.CloudFormation, params: StackParameters): Promise<void> => {
  console.log(chalk.hex('777777')(`Cloudgenie: Updating Stack (${chalk.hex('BBBBBB')(params.name)})`))
  await cf.updateStack(getStackParams(params)).promise()
  console.log(chalk.hex('777777')(`Cloudgenie: Describe Stack Events (${chalk.hex('BBBBBB')(params.name)})`))
  await monitorEvents(cf, params.name, (event) => console.log(renderEvent(event)));
  console.log(chalk.hex('777777')(`Cloudgenie: Stack update (${chalk.hex('BBBBBB')(params.name)}) finished...`), )
}

const parseStackParameters = (stackParameters: CloudGenie.Types.Stack): StackParameters => {
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

export const deploy = async (parameters: CloudGenie.Types.Stack): Promise<void> => {
  const params = parseStackParameters(parameters)
/*
  const renderParams = prettyjson.render(params, {
    noColor: false,
    keysColor: 'yellow',
    dashColor: 'white',
  })
*/
  console.log(chalk.hex('777777')('Cloudgenie: Using stack parameters:'))
/*
  const previewParams = Object.assign({}, params, { template: params.templateRaw });
  delete previewParams.templateRaw;
  console.log(JSON.stringify(previewParams, null, 2));
*/

  const cf = new AWS.CloudFormation();
  await validateStack(cf, params)
  if (await stackExists(cf, params.name)) {
    await updateStack(cf, params)
  } else {
    await createStack(cf, params)
  }
}

export const remove = async (parameters: CloudGenie.Types.Stack): Promise<void> => {
  const params = parseStackParameters(parameters)
  const renderParams = prettyjson.render(params, {
    noColor: false,
    keysColor: 'yellow',
    dashColor: 'white',
  })
  console.log(chalk.hex('777777')(`Cloudgenie: Using stack parameters:\n${renderParams}`), )

  const cf = new AWS.CloudFormation();

  if (await stackExists(cf, params.name)) {
    await removeStack(cf, params)
  } else {
    throw `Stack (${params.name}) does not exist`;
  }
}
