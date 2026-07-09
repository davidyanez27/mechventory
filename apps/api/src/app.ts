import express from 'express';
import { identityMiddleware } from './middleware/identity.js';
import {
  cognitoErrorMiddleware,
  customErrorMiddleware,
  notFoundMiddleware,
  pgErrorMiddleware,
  serverErrorMiddleware,
  zodErrorMiddleware,
} from './middleware/errors.js';
import { usersRouter } from './modules/users/routes.js';
import { productsRouter } from './modules/products/routes.js';
import { customersRouter } from './modules/customers/routes.js';
import { companiesRouter } from './modules/companies/routes.js';
import { invoicesRouter } from './modules/invoices/routes.js';

export const app = express();

app.use(express.json());

// Public — matches the unauthenticated `GET /health` route in API Gateway.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Everything below sits behind the Cognito JWT authorizer (`ANY /{proxy+}`);
// identityMiddleware turns the verified claims into `req.identity`.
app.use('/users', identityMiddleware, usersRouter);
app.use('/products', identityMiddleware, productsRouter);
app.use('/customers', identityMiddleware, customersRouter);
app.use('/companies', identityMiddleware, companiesRouter);
app.use('/invoices', identityMiddleware, invoicesRouter);

// No route matched.
app.use(notFoundMiddleware);

// Error chain: most specific first, generic 500 last.
app.use(zodErrorMiddleware);
app.use(customErrorMiddleware);
app.use(pgErrorMiddleware);
app.use(cognitoErrorMiddleware);
app.use(serverErrorMiddleware);
