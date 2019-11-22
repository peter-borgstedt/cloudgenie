const { reformat } = require('./common');

module.exports = function(source) {
  const { options } = this.loaders[this.loaderIndex];
  if (this.cacheable) {
    this.cacheable();
  }
  return `module.exports = ${reformat(options, JSON.parse(source))}`;
}
