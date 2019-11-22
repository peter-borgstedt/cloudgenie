const { reformat, read } = require('./common');

module.exports = class PackageJsonReformatPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const plugin = { name: 'PackageReformatter' };

    compiler.hooks.emit.tapAsync(plugin, (compilation, callback) => {
      const content = reformat(this.options, read(this.options.src));

      compilation.assets[this.options.src] = {
        source: () => {
          return content;
        },
        size: () => {
          return content.length;
        },
      };
      callback();
    });
  }
}