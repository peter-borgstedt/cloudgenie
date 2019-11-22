import { error } from './log';

type Action = (...args: string[]) => Promise<void>

/**
 * Wraps a command function with some extra logic around uncaptured errors and also
 * optionally validating so the configuration have been setup properly.
 */
export default (action: Action): Action => {
  return async (... args: string[]): Promise<void> => {
    try {
      await action(... args);
      process.exit(0);
    } catch(err) {
      error(err);
      process.exit(1);
    }
  };
};
