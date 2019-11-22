// istanbul ignore file
// tslint:disable:no-console
const fs = require('fs');
const yaml = require('js-yaml');

const getReferences = (content) => {
  const regexp = /^(\w*):\s?&\w*$/gm;
  const references = [];

  let match;
  do {
    match = regexp.exec(content);
    if (match) {
      references.push(match[1]);
    }
  } while (match);
  return references;
};

const readEnvironments = () => {
  const content = fs.readFileSync('env.yml', 'utf8');
  const references = getReferences(content);
  const yml = yaml.safeLoad(content);
  references.forEach(ref => delete yml[ref]);
  return yml;
};

const env = readEnvironments();

const replaceValues = (value, replacements) => {
  return value.replace(/\${self:stage}/g, replacements.stage);
};

const setEnvironments = (stage) => {
  const replacements = { stage };

  const environments = Object.entries(env[stage])
    .reduce((obj, [ key, value ]) => {
      obj[key] = replaceValues(value, replacements);
      return obj;
    }, {});

  process.env = Object.assign(process.env, environments);
};

const getArgStage = () => {
  const options = ['--stage', '-stage'];
  const args = process.argv.slice(2);
  const index = args.findIndex(v => options.includes(v.toLocaleLowerCase()));
  if (~index) {
    return args[index + 1]
  }
}

const getStage = () => {
  const argStage = getArgStage();
  const envStage = process.env.NODE_ENV;
  const stage = argStage || envStage || 'test';

  if (!Object.keys(env).includes(stage)) {
    throw new Error(`Stage ${stage} is not a valid stage`);
  }
  return stage;
};

module.exports = {
  getEnvironments: (stage) => env[stage],
  setEnvironments,
  getStage,
};
