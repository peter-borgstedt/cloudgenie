declare global {
  namespace CloudGenie {
    namespace Types {
      interface Stack {
        name: string;
        bucket: string;
        bucketPrefix?: string;
        parameters?: { [ key: string ]: string };
        tags?: { [ key: string ]: string };
        resources: string[];
      }

      interface StackParameters {
        name: string;
        template: { obj: object; str: string };
        parameters: AWS.CloudFormation.Parameter[];
        tags: AWS.CloudFormation.Tag[];
      }

      interface Settings {
        region: string;
        profile: string;
      }
    }

    interface Configuration {
      settings: Types.Settings;
      stacks: { [ key: string ]: Types.Stack };
    }
  }
}

export {}
