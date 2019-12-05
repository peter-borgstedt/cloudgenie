import AWS from 'aws-sdk';
import chalk from '@common/chalk'
import { monitorEvents } from './monitoring';
import { renderEvent } from '@common/renderer';

const getParams = (
  params: {
    name: string;
    parameters: AWS.CloudFormation.Parameter[];
    tags: AWS.CloudFormation.Tag[];
    template: { obj: object; str: string };
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
    TemplateBody: template.str
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

export const validateStack = async (cf: AWS.CloudFormation, params: CloudGenie.Types.StackParameters): Promise<void> => {
  process.stdout.write(chalk.hex('777777')(`Cloudgenie: Validating template (${chalk.hex('BBBBBB')(params.name)})`))
  const result = await cf.validateTemplate({ TemplateBody: params.template.str }).promise()
  console.log(` ${chalk.green('OK!')}`)
  console.log({ result });
}

export const createStack = async (cf: AWS.CloudFormation, params: CloudGenie.Types.StackParameters): Promise<void> => {
  console.log(chalk.hex('777777')(`Cloudgenie: Creating Stack (${chalk.hex('BBBBBB')(params.name)})...`))
  await cf.createStack(Object.assign(getParams(params), {
    OnFailure: "ROLLBACK",
    EnableTerminationProtection: false
  })).promise()
  console.log(chalk.hex('777777')(`Cloudgenie: Describe Stack Events (${chalk.hex('BBBBBB')(params.name)})`))
  await monitorEvents(cf, params.name, (event) => console.log(renderEvent(event)));
  console.log(chalk.hex('777777')(`Cloudgenie: Stack creation (${chalk.hex('BBBBBB')(params.name)}) finished...`), )
}

export const updateStack = async (cf: AWS.CloudFormation, params: CloudGenie.Types.StackParameters): Promise<void> => {
  console.log(chalk.hex('777777')(`Cloudgenie: Updating Stack (${chalk.hex('BBBBBB')(params.name)})`))
  await cf.updateStack(getParams(params)).promise()
  console.log(chalk.hex('777777')(`Cloudgenie: Describe Stack Events (${chalk.hex('BBBBBB')(params.name)})`))
  await monitorEvents(cf, params.name, (event) => console.log(renderEvent(event)));
  console.log(chalk.hex('777777')(`Cloudgenie: Stack update (${chalk.hex('BBBBBB')(params.name)}) finished...`), )
}

export const removeStack = async (cf: AWS.CloudFormation, params: CloudGenie.Types.StackParameters): Promise<void> => {
  console.log(chalk.hex('777777')(`Cloudgenie: Deleting Stack (${chalk.hex('BBBBBB')(params.name)})`))
  await cf.deleteStack({ StackName: params.name }).promise()
  console.log(chalk.hex('777777')(`Cloudgenie: Describe Stack Events (${chalk.hex('BBBBBB')(params.name)})`))
  await monitorEvents(cf, params.name, (event) => console.log(renderEvent(event)));
  console.log(chalk.hex('777777')(`Cloudgenie: Stack deletion (${chalk.hex('BBBBBB')(params.name)}) finished...`), )
}
