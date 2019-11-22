import chalk from '@common/chalk';

export const symbols = {
  star: '\u2605',
  heart: '\u2764'
};

export const info = (message: string): void => {
  console.log(chalk.red(symbols.heart), `${chalk.green(message)}`);
};

export const warn = (message: string): void => {
  console.log(chalk.red('\u272a'), `${chalk.yellow(message)}`);
};

export const error = (error: any): void => {
  if (process.verbose) {
    console.error(error);
  } else {
    console.log(chalk.red('>>'), `${chalk.yellow(error && error.message || error)}`);
  }
};

export const custom = (message: string, symbol = '\u2139'): void => {
  console.log(symbol + message);
};

/**
 * Debug message that is only visible when you run the program with the -v or --verbose flag.
 * @param message any text message
 */
export const debug = (message): void => {
  if (process.verbose) {
    console.log(chalk.gray('\u2022'), `${chalk.white.italic(message)}`);
  }
};
