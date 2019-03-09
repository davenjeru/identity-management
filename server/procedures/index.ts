/** This file collects all defined procedures and exports them in an object */
import createUser from './createUser';
import loginUser from './loginUser';

const procedures = {
  createUser,
  loginUser,
};

export default procedures;
