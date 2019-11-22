import AWS from 'aws-sdk';
import chalk from '@common/chalk'

export const setAWSCredentials = ({ region, profile}): void => {
  console.log(chalk.hex('777777')(`Cloudgenie: Using region: ${chalk.hex('BBBBBB')(region)}`), )
  AWS.config.region = region
  console.log(chalk.hex('777777')(`Cloudgenie: Using crendetials profile: ${chalk.hex('BBBBBB')(profile)}`), )
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
}
