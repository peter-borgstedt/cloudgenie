import { read } from '@common/config';
import { remove } from '@common/stack/stack';
import { setAWSCredentials } from '@common/credentials';

export default async (... args: string[]): Promise<void> => {
  const { settings, stacks } = read();

  setAWSCredentials(settings);
  for (const stack of Object.values(stacks)) {
    await remove(stack);
  }
};
