import { StackEvent } from 'aws-sdk/clients/cloudformation'
import chalk from './chalk';
import moment from 'moment';

const renderStatus = (status: string): string => {
  switch(status) {
    case 'CREATE_IN_PROGRESS':                           return chalk.custom.yellow(status);
    case 'CREATE_FAILED':                                return chalk.red(status);
    case 'CREATE_COMPLETE':                              return chalk.green(status);
    case 'ROLLBACK_IN_PROGRESS':                         return chalk.custom.yellow(status);
    case 'ROLLBACK_FAILED':                              return chalk.red(status);
    case 'ROLLBACK_COMPLETE':                            return chalk.green(status);
    case 'DELETE_IN_PROGRESS':                           return chalk.custom.yellow(status);
    case 'DELETE_FAILED':                                return chalk.red(status);
    case 'DELETE_COMPLETE':                              return chalk.green(status);
    case 'UPDATE_IN_PROGRESS':                           return chalk.custom.yellow(status);
    case 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS':          return chalk.custom.yellow(status);
    case 'UPDATE_COMPLETE':                              return chalk.green(status);
    case 'UPDATE_ROLLBACK_IN_PROGRESS':                  return chalk.custom.yellow(status);
    case 'UPDATE_ROLLBACK_FAILED':                       return chalk.red(status);
    case 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS': return chalk.green(status);
    case 'UPDATE_ROLLBACK_COMPLETE':                     return chalk.green(status);
    case 'REVIEW_IN_PROGRESS':                           return chalk.custom.yellow(status);
    case 'IMPORT_IN_PROGRESS':                           return chalk.custom.yellow(status);
    case 'IMPORT_COMPLETE':                              return chalk.red(status);
    case 'IMPORT_ROLLBACK_IN_PROGRESS':                  return chalk.custom.yellow(status);
    case 'IMPORT_ROLLBACK_FAILED':                       return chalk.red(status);
    case 'IMPORT_ROLLBACK_COMPLETE':                     return chalk.green(status);
  }
}

const renderDate = (date: Date): string => {
  return moment(date).format('YYYY-MM-DD:hh:mm:ss')
}

export const renderEvent = (event: StackEvent): string => {
  const { Timestamp, LogicalResourceId, ResourceType, ResourceStatus, ResourceStatusReason } = event;
  const status = renderStatus(ResourceStatus);
  const logicalId = chalk.blue(LogicalResourceId);
  const reason = ResourceStatusReason ? `: ${ResourceStatusReason}` : '';
  const prefix = chalk.hex('777777')(`Cloudformation [${renderDate(Timestamp)}]:`);
  return `${prefix} ${ResourceType} - ${logicalId} - ${status}${reason}`;
}
