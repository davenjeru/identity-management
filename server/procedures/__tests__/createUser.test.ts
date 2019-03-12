import { verifyIdToken} from '../../../__mocks__/google-auth-library';
import { send } from '../../../__mocks__/mailgun-js';
import env from '../../config';
import { buyer } from '../../database/models/role';
import User from '../../database/models/user';
import { clearDB } from '../../database/queries';
import seedDB from '../../database/seeders';
import createUser from '../createUser';
import { mockUser } from '../mockData';

describe('Create User rpc', () => {
  beforeAll(async (done) => {
    await clearDB();
    await seedDB();
    done();
  });

  afterAll(async (done) => {
    await clearDB();
    done();
  });

  describe('should call verifyIdToken', () => {
    it('should return error if token is invalid', async (done) => {
      const token = 'this is my token';
      const clientCallback = jest.fn();
      // @ts-ignore
      await createUser({ request: { token }}, clientCallback);
      // Ensure verifyIdToken was called with the expected arguments
      expect(verifyIdToken).toHaveBeenCalledWith({ audience: env.GOOGLE_CLIENT_ID, idToken: token });
      // Ensure user is not created
      expect(await User.findUserByEmail(mockUser.email)).toBe(false);
      // Ensure the client callback function is called with an error
      const [[args]] = clientCallback.mock.calls;
      expect(args.message).toEqual('The id token provided is invalid!');
      done();
    });

    it('should create user in db if token is valid and return user info', async (done) => {
      const token = 'this is my token';
      const clientCallback = jest.fn();
      // @ts-ignore
      await createUser({ request: { token }}, clientCallback);
      // Ensure verifyIdToken was called with the expected arguments
      expect(verifyIdToken).toHaveBeenCalledWith({ audience: env.GOOGLE_CLIENT_ID, idToken: token });
      // Ensure user is created
      const createdUser = await User.findUserByEmail(mockUser.email);
      // @ts-ignore
      expect(createdUser.email).toEqual(mockUser.email);
      // @ts-ignore
      expect(createdUser.mailSent).toBe(false);
      // We check that the role is buyer by default
      // @ts-ignore
      expect(createdUser.role.roleName).toEqual(buyer.roleName);
      // Ensure the client callback function is called with the expected response
      const [[args1, args2]] = clientCallback.mock.calls;
      expect(args1).toBe(null);
      expect(args2.email).toEqual(mockUser.email);
      expect(args2.name).toEqual(mockUser.name);
      expect(args2.token).toBeTruthy();
      done();
    });
  });

  describe('should send verification email', () => {
    it('should not update mailSent status if an error occurs while sending', async (done) => {
      // The createUser procedure was called twice above, in the first call,
      // a verification email was not sent because the id token was invalid.
      // In the second call the verification email was not sent because the first call to send()
      // is built to return an error and therefore, we check that the mail sent status was not updated.
      const storedUser = await User.findUserByEmail(mockUser.email);
      // @ts-ignore
      expect(storedUser.mailSent).toBe(false);
      // @ts-ignore
      expect(storedUser.mailSentDate).toBeFalsy();
      done();
    });

    it('should send verification email', async (done) => {
      const token = 'this is my token';
      // @ts-ignore
      await createUser({ request: { token }}, jest.fn());
      const [[args1]] = send.mock.calls;
      expect(args1.to).toEqual(mockUser.email);
      expect(args1.subject).toEqual('Shop-Inc Account Verification Email');
      // After a successfully sent email, we ensure that the mailSent status is updated.
      const storedUser = await User.findUserByEmail(mockUser.email);
      // @ts-ignore
      expect(storedUser.mailSent).toBe(true);
      // @ts-ignore
      expect(storedUser.mailSentDate).toBeTruthy();
      done();
    });
  });
});
