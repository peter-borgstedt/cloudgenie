import { removeStack, stackExists } from '@common/stack/stack';
import AWS from 'aws-sdk';
import { parse } from '@common/parser';
import { read } from '@common/config';
import { setAWSCredentials } from '@common/credentials';

const remove = async (parameters: CloudGenie.Types.Stack): Promise<void> => {
  const params = parse(parameters)
  // console.log(chalk.hex('777777')(`Cloudgenie: Using stack parameters:\n${renderParams}`), )

  const cf = new AWS.CloudFormation();
  if (await stackExists(cf, params.name)) {
    await removeStack(cf, params)
  } else {
    throw `Stack (${params.name}) does not exist`;
  }
}

/**
 * Action that remove the current stack configurations 
 */
export default async (): Promise<void> => {
  const { settings, stacks } = read();

  setAWSCredentials(settings);

  for (const stack of Object.values(stacks)) {
    await remove(stack);
  }
};
