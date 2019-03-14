import getEnv from './utils';
import generalOptionalVariables from './utils/optionalVariables';
import r from './utils/requiredVariables';

// Define the required variables
const requiredVariables: string[] = [...r];
// Define optional environment variables and their defaults for development
const optionalVariables = {
  GRAPH_DB_NAME: 'shopinc_dev',
  GRPC_SERVER_HOST: '0.0.0.0',
  ...generalOptionalVariables,
};

export default () => getEnv(requiredVariables, optionalVariables);
