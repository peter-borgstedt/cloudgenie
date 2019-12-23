import JSZip from 'jszip';
import { S3 } from 'aws-sdk';
import fs from 'fs'
import globby from 'globby';
import os from 'os'
import path from 'path';

export const process = (src: string, dst = 'dist'): void => {
  if (fs.lstatSync(src).isDirectory()) {
    fs.copyFileSync(src, dst);
  }
  throw new Error(`${src} is not a directory`);
}

export const upload = (bucket: string, prefix: string, fileName: string): void => {
  const artifactDirectory = `${bucket}/${prefix}/${new Date().toISOString()}/${fileName}`;
}

export const getMeta = async (bucket: string): Promise<void> => {
  const params = {
    Bucket: bucket,
    Prefix: '',
  };
  new S3().listObjectsV2();
}

export const createDirectoryRecursive = (filePath: string): void => {
  // Node > 10.12.0 supports fs.mkdir with recursive option,
  // this is to suport older versions of Node
  const segments = path.dirname(filePath).split(path.sep);
  segments.reduce((acc, segment) => {
    const dirname = path.join(acc, segment)
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname);
    }
    return dirname
  }, filePath.startsWith(path.sep) ? path.sep : '')
}

const modifyContent = async (src, name) => {
  // const dstDirPath = path.join(dst, name);
  const tmpDirPath = path.join(os.tmpdir(), 'cloudgenie', name)
  for (const filePath of await globby(`${src}/**/*.js`)) {
    const tmpFilePath = path.resolve(tmpDirPath, path.relative(src, filePath));
    createDirectoryRecursive(tmpFilePath);
    fs.copyFileSync(filePath, tmpFilePath);
  }
  // const stat = fs.statSync(filePath);
  // unixPermissions: stat.mode
}

export const pack = async (src: string, dst: string, name: string): Promise<void> => {
  const srcPath = path.resolve(src);

  const zip = new JSZip().folder(srcPath);
  for (const filePath of await globby(`${srcPath}${path.sep}**${path.sep}*.js`)) {
    console.log(filePath)
    zip.file(path.relative(src, filePath), fs.readFileSync(filePath), {
      date: new Date(0), // Needed to calculate the same hash of existing and new zip files
    });
  }

  const output = path.join(dst, `${name}.zip`)
  createDirectoryRecursive(output);

  zip
    .generateNodeStream({
      type: 'nodebuffer',
      streamFiles: true
    })
    .pipe(fs.createWriteStream(output))
    .on('finish', () => {
      console.log(`${output} written.`);
    });
}

