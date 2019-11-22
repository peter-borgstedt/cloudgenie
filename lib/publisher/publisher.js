const { getStage } = require('../env-loader/index');
const { name, version } = require(`${process.cwd()}/dist/package.json`);
const spawn = require('cross-spawn');

const access = getStage() === 'prod' ? 'public' : 'restricted';
spawn.sync('npm', ['publish', 'dist', '--tag=latest', `--access ${access}`], { stdio: 'inherit' });

const tag = version.includes('beta') ? 'beta' : version.includes('alpha') ? 'alpha' : 'stable';
spawn.sync('npm', ['dist-tag', 'add', `${name}@${version}`, tag], { stdio: 'inherit' });
