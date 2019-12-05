import * as fs from 'fs';
import { createStack, stackExists, updateStack, validateStack} from '@common/stack/stack';
import AWS from 'aws-sdk';
import { parseStackParameters } from '@common/parser';
import { read } from '@common/config';
import { setAWSCredentials } from '@common/credentials';

const deploy = async (parameters: CloudGenie.Types.Stack): Promise<void> => {
  const params = parseStackParameters(parameters)
  fs.writeFileSync(`${process.cwd()}/template.yaml`, params.template.str, { encoding: 'UTF-8' });

  // console.log(chalk.hex('777777')(`Cloudgenie: Using stack parameters:\n${renderParams}`), )

  const cf = new AWS.CloudFormation();
  await validateStack(cf, params)
  if (await stackExists(cf, params.name)) {
    await updateStack(cf, params)
  } else {
    await createStack(cf, params)
  }
}

/**
 * Action that create or update the current stack configurations 
 */
export default async (): Promise<void> => {
  const { settings, stacks } = read();

  setAWSCredentials(settings);

  for (const stack of Object.values(stacks)) {
    await deploy(stack);
  }
};
