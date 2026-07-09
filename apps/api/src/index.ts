import { configure as serverlessExpress } from '@codegenie/serverless-express';
import { app } from './app.js';

// Lambda entrypoint. API Gateway (HTTP API, payload v2) → serverless-express →
// Express. Exported as `handler` to match the Terraform `index.handler`.
export const handler = serverlessExpress({ app });
