import { pack } from '@common/stack/pack';
import { parseStackParameters } from '@common/parser';
import { read } from '@common/config';
import { setAWSCredentials } from '@common/credentials';

type Settings = CloudGenie.Types.Settings;
type Stack = CloudGenie.Types.Stack;

const doPackage = async (settings: Settings, parameters: Stack): Promise<void> => {
  const params = parseStackParameters(parameters)
  const functions = params.context?.function ?? [];
  for (const content of functions) {
    await pack(content.codeUriSrc, settings.output ?? 'dist', content.name)
  }
}

/**
 * Action that remove the current stack configurations 
 */
export default async (): Promise<void> => {
  const { settings, stacks } = read();

  setAWSCredentials(settings);

  for (const stack of Object.values(stacks)) {
    await doPackage(settings, stack);
  }
};
