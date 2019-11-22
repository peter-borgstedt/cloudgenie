"use strict";

const Promise = require("bluebird");
const fs = require("fs");

const argsHandler = (function () {
  const argv = process.argv.slice(2);

  const generateOptions = () => {
    const options = {};
    for (let i = 0; i < argv.length; i += 2) {
      const arg = argv[i];
      const val = argv[i + 1];
      switch (arg) {
        case "-p": {
          options.profile = val;
        }          break;
        case "-s": {
          options.stage = val;
        }          break;
        case "-n": {
          options.stackName = val;
        }          break;
        case "-f": {
          options.fileName = val;
        }          break;
      }
    }
    if (options.stage === undefined) {
      throw new Error("Missing stage parameter");
    } else if (options.stackName === undefined) {
      throw new Error("Missing stackname parameter -n");
    } else if (options.fileName === undefined) {
      throw new Error("Missing filename parameter -f");
    }
    return options;

  };

  return {
    getOptions: generateOptions
  };
})();

const CFHandler = (function () {
  let script = null;
  const AWS = require("aws-sdk");
  let cf = null;
  const init = (options) => {
    AWS.config.setPromisesDependency(require("bluebird"));
    AWS.config.region = "eu-west-1";
    if (options.profile) {
      console.log("configuring to use profile");
      AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: options.profile });
    }
    cf = new AWS.CloudFormation();
  };

  const loadScript = (fileName) => {
    script = fs.readFileSync(`./${fileName}`, "utf8");
  };

  const findStack = (stackName) => {
    return new Promise((resolve, reject) => {
      cf.describeStacks({
        StackName: stackName
      }, function (error, result) {
        if (error) {
          if (/does not exist$/.test(error.message)) {
            return resolve(false);
          }
          console.log(error);
          return reject();
        }
        // console.log(result);
        return resolve(true);
      });
    });
  };

  const createStack = (options) => {
    return new Promise((resolve, reject) => {
      const dop = {
        StackName: options.stackName,
        Capabilities: [
          "CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"
        ],
        EnableTerminationProtection: false,
        OnFailure: "ROLLBACK",
        Parameters: [
          {
            ParameterKey: "Stage",
            ParameterValue: options.stage
          }
        ],
        Tags: [
          {
            Key: "Environment",
            Value: options.stage
          }
        ],
        TemplateBody: script
      };
      return cf.createStack(dop, function (err, result) {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
    });
  };

  const updateStack = (options) => {
    return new Promise((resolve, reject) => {
      const dop = {
        StackName: options.stackName,
        Capabilities: [
          "CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"
        ],
        Parameters: [
          {
            ParameterKey: "Stage",
            ParameterValue: options.stage
          }
        ],
        Tags: [
          {
            Key: "Environment",
            Value: options.stage
          }
        ],
        TemplateBody: script
      };
      return cf.updateStack(dop, function (error, result) {
        if (error) {
          if (/No updates are to be performed/.test(error.message)) {
            return resolve(false);
          }
          console.log(error);
          return reject();
        }

        return resolve(true);
      });
    });

  };

  const checkStatus = (stackName) => {
    return new Promise((resolve, reject) => {
      cf.describeStacks({
        StackName: stackName
      }, function (error, result) {
        if (error) {
          console.log(error);
          return reject();
        }
        return resolve(result.Stacks[0].StackStatus);
      });
    });

  };

  const statusCheckLoop = Promise.coroutine(function* (stackName) {
    let shouldExit = false;
    let printedInitial = false;
    while (!shouldExit) {
      const status = yield checkStatus(stackName);
      if (!printedInitial) {
        console.log(status);
        printedInitial = true;
      }
      if (/CREATE_COMPLETE/.test(status) || /UPDATE_COMPLETE/.test(status)) {
        console.log(status);
        shouldExit = true;
        return;
      } else if (/FAILED/.test(status) || /UPDATE_ROLLBACK_COMPLETE/.test(status)) {
        console.log(status);
        throw new Error("Failed to create or update stack");
      }
      yield Promise.delay(10000);
    }
  });

  return {
    run: Promise.coroutine(function* (options) {
      init(options);
      loadScript(options.fileName);

      console.log("Searching for existing stack");
      const exists = yield findStack(options.stackName);
      let started = false;
      if (!exists) {
        console.log("creating stack");
        yield createStack(options);
        started = true;
        yield Promise.delay(10000);
      } else {
        console.log("updating stack");
        started = yield updateStack(options);
      }

      if (started) {
        console.log("looking for stack updates");
        statusCheckLoop(options.stackName);
      } else {
        console.log("no stack updates made");
      }
    })
  };
})();

const registerErrorHandlers = () => {
  process.removeAllListeners("uncaughtException");
  process.removeAllListeners("unhandledRejection");
  process.on("uncaughtException", function (err) {
    console.error(err);
    process.exitCode = 1;
  });

  process.on("unhandledRejection", function (err, promise) {
    console.error(err);
    process.exitCode = 1;
  });
};

try {
  registerErrorHandlers();
  const options = argsHandler.getOptions();
  CFHandler.run(options);
} catch (err) {
  console.log("something");
  throw new Error("error");
}