global['__basedir'] = __dirname; // DO NOT REMOVE FROM TOP!

import * as logger from '@common/log';
import { deploy, packaging, remove } from '@actions';
import actionRunner from '@common/action';
import chalk from '@common/chalk';
import commander from 'commander';

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const options = args.filter(v => v.startsWith('-'));

  // First thing is to set verbose so all debugs are logged 
  if (options.includes('-v')) {
    process['verbose'] = true;
    logger.debug('VERBOSE: ON');
  }

  // Text replacement of command help
  commander.option('-v, --verbose', 'output detailed info');

  commander.on('command:*', () => {
    logger.error(`Invalid command: ${commander.args.join(' ')}\nSee --help for a list of available commands.`);
  });

  commander
    .command('deploy')
    .description(chalk.magenta('Deploy'))
    .action(actionRunner(deploy));

  commander
    .command('remove')
    .description(chalk.magenta('Remove'))
    .action(actionRunner(remove));

    commander
      .command('package')
      .description(chalk.magenta('Package'))
      .action(actionRunner(packaging));

}

// Run
(async (): Promise<void> => {
  try {
    await main();
    if (commander.parse(process.argv).rawArgs.length < 3) {
      commander.help();
    }
  } catch (error) {
    logger.error(error);
  }
})()
