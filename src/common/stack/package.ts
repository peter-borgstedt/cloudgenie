import { S3 } from 'aws-sdk';
import fs from 'fs'
import globby from 'globby';
import path from 'path';
import jszip from 'jszip';

export const process = (src: string, dst = 'dist'): void => {
  if (fs.lstatSync(src).isDirectory()) {
    fs.copyFileSync(src, dst);
  }
  throw new Error(`${src} is not a directory`);
}

export const upload = (bucket: string, prefix: string, functionName: string): void => {
  const artifactDirectory = `${bucket}/${prefix}/${new Date().toISOString()}`;
}

export const pack = async (path: string, functionName: string): Promise<void> => {
  const files = await globby([path, '*.js']);
  for (const file of files) {
    console.log(file)
  }
}

export const createDirectoryRecursive = (filePath: string): void => {
  // Node > 10.12.0 supports fs.mkdir with recursive option,
  // this is to suport older versions of Node
  const segments = filePath.split(path.sep);
  segments.reduce((acc, segment) => {
    const dirname = path.join(acc, segment)
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname);
    }
    return dirname
  }, filePath.startsWith(path.sep) ? path.sep : '')
}
