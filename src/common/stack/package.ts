import { S3 } from 'aws-sdk';
import fs from 'fs'

export const process = (src: string, dst = 'dist'): void => {
  if (fs.lstatSync(src).isDirectory()) {
    fs.copyFileSync(src, dst);
  }
  throw new Error(`${src} is not a directory`);
}

export const upload = (): void => {
  
}