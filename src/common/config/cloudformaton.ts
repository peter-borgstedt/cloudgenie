import path from 'path';

export const parseFunction = (logicalID, resource, input, output): void => {
  const { Properties } = resource;
  const { packageSettings: { bucket, bucketPrefix }, filePath } = input;

  console.log(input);
  console.log(bucket, bucketPrefix);
  const { CodeUri } = Properties;


  const content: any = {};
  content.name = logicalID;

  if (CodeUri) {
    content.codeUriSrc = path.join(path.dirname(filePath), Properties.CodeUri);
    content.codeUriDst = `s3://${bucket}/${bucketPrefix}/${logicalID}.zip`;
    Properties.CodeUri = content.codeUriDst;
  }

  if (Object.keys(content).length) {
    output.push(content);
  }
}

export const parse = (type: string, logicalID: string, resource: any, input: any, output: any): void => {
  switch(type) {
    case 'function': parseFunction(logicalID, resource, input, output)
  }
}
