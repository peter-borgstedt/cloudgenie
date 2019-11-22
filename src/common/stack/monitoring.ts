import CloudFormation, { StackEvent } from 'aws-sdk/clients/cloudformation'
import moment, { Moment } from 'moment';

type ObsoleteEvents = { [ key: string ]: boolean }

const BEGIN_STATUSES = [
  'UPDATE_IN_PROGRESS',
  'CREATE_IN_PROGRESS',
  'DELETE_IN_PROGRESS'
]

const END_STATUSES = [
  'UPDATE_COMPLETE',
  'UPDATE_ROLLBACK_COMPLETE',
  'UPDATE_ROLLBACK_FAILED',
  'CREATE_COMPLETE',
  'CREATE_FAILED',
  'ROLLBACK_COMPLETE',
  'ROLLBACK_FAILED',
  'DELETE_COMPLETE',
  'DELETE_FAILED',
  'IMPORT_COMPLETE',
  'IMPORT_ROLLBACK_COMPLETE',
  'IMPORT_ROLLBACK_FAILED',
]

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve): void => {
    setTimeout(() => resolve(), ms)
  });
}

const getStartDate = (stackEvents: StackEvent[]): Moment => {
  const startEvent = stackEvents.find(({ ResourceType, ResourceStatus }) => {
    return ResourceType === 'AWS::CloudFormation::Stack' && BEGIN_STATUSES.includes(ResourceStatus);
  })
  return moment(startEvent.Timestamp).subtract(5, 'seconds')
}

const getEvents = (stackEvents: StackEvent[], startDate: Moment, obsoleteEvents: ObsoleteEvents): StackEvent[] => {
  return stackEvents
    .filter(({ Timestamp, LogicalResourceId, ResourceType, ResourceStatus }) => {
      return startDate.isBefore(Timestamp) && !obsoleteEvents[ResourceType + LogicalResourceId + ResourceStatus]
    })
    .sort((a, b) => a.Timestamp.getTime() - b.Timestamp.getTime())
}

export const monitorEvents = async (cf: CloudFormation, stackName: string, observer: (event: StackEvent) => void): Promise<void> => {
  const obsoleteEvents = {}
  const { Stacks: [ { StackId: stackId } ] } = await cf.describeStacks({ StackName: stackName }).promise()

  let nextToken = null;

  // eslint-disable-next-line no-constant-condition
  while(true) {
    const result = await cf.describeStackEvents({ StackName: stackId, NextToken: nextToken }).promise();
    const startDate = getStartDate(result.StackEvents);
    const events = getEvents(result.StackEvents, startDate, obsoleteEvents);

    const done = events.some((event) => {
      const { LogicalResourceId, ResourceType, ResourceStatus } = event;
      obsoleteEvents[ResourceType + LogicalResourceId + ResourceStatus] = true;  
      observer(event);
      return ResourceType === 'AWS::CloudFormation::Stack' && END_STATUSES.includes(ResourceStatus)
    })

    if (done) {
      return;
    }

    nextToken = result.NextToken;
    await wait(2500);
  }
}
