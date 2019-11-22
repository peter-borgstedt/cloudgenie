// tslint:disable: no-console

const fs = require('fs');

module.exports.read = (path) => {
  return JSON.parse(fs.readFileSync(`${process.cwd()}/${path}`, { encoding: 'utf-8' }));
};

module.exports.reformat = (options, pjson) => {
  const { allowed = [], append = {}, stage } = options;
  const appendables = append[stage] || {};
  const mergedKeys = [ ... allowed, ... Object.keys(appendables) ];

  return JSON.stringify(mergedKeys
    .reduce((obj, key) => {
      const value = appendables[key] || pjson[key];

      // Ignore empty arrays
      if (Array.isArray(value) && !value.length) {
        return obj;
      }

      // Ignore empty objects
      if (value.constructor === Object && !Object.keys(value).length) {
        return obj;
      }

      obj[key] = value;
      return obj;
    }, {}), null, 2)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}