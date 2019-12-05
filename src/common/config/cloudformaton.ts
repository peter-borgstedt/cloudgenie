import path from 'path';

export const parseFunction = (
  { Properties },
  { bucket, bucketPrefix, filePath },
  outputs: any
): void => {
  if (Properties.CodeUri) {
    const normalizedPath = path.join(path.dirname(filePath), Properties.CodeUri);
    (outputs.uris || (outputs.uris = [])).push(normalizedPath);

    Properties.CodeUri = `s3://${bucket}/${bucketPrefix}/${normalizedPath}`;
  }
}

export const parse = (type: string, resource: any, input: any, output: any): void => {
  switch(type) {
    case 'function': parseFunction(resource, input, output)
  }
}
