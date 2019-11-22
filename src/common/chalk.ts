import { Chalk, ColorSupport } from 'chalk';
import chalk from 'chalk';

type ChalkObject = Chalk & { supportsColor: ColorSupport };
interface ArbitraryColors { custom: { [key: string]: ChalkObject } }

const extended = chalk as ChalkObject & ArbitraryColors;

extended.custom = {
  grey: chalk.rgb(192, 192, 192),
  orange: chalk.rgb(255, 195, 120),
  pink: chalk.rgb(220, 150, 200),
  summerPink: chalk.rgb(255, 204, 255),
  brown: chalk.rgb(190, 100, 0),
  purple: chalk.rgb(210, 120, 250),
  purpleLight: chalk.rgb(130, 80, 170),
  blue: chalk.rgb(120, 205, 230),
  greenLight: chalk.rgb(164, 218, 202),
  green: chalk.rgb(100, 195, 165),
  yellow: chalk.rgb(245, 245, 73)
};

export default extended;
