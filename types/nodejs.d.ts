/* eslint-disable no-redeclare */

declare global {
  let __basedir: string;

  namespace NodeJS {
    interface Process {
      verbose: boolean;
      identity: {
        email: string;
        firstname: string;
        surname: string;
        role: string;
        company: string;
        isAdmin: boolean;
        isPowerUser: boolean;
      };
    }
    interface ProcessEnv {
      apiURL: string;
      configPath: string;
    }
  }
}

export {}
