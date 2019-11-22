import * as fs from 'fs';
import yaml from 'js-yaml';

export const read = (): CloudGenie.Configuration => {
  const content = fs.readFileSync(process.env.configFileName, 'utf8');
  const configuration = yaml.safeLoad(content);

  return {
    settings: configuration.settings || configuration.Settings,
    stacks: configuration.stacks || configuration.Stacks
  };
}
