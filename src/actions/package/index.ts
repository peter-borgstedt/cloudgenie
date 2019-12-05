import AWS from 'aws-sdk';
import { parseStackParameters } from '@common/parser';
import { process } from '@common/stack/package';
import { read } from '@common/config';
import { setAWSCredentials } from '@common/credentials';

const remove = async (parameters: CloudGenie.Types.Stack): Promise<void> => {
  const params = parseStackParameters(parameters)
  console.log(params)
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
