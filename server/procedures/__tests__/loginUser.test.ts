import { verifyIdToken } from '../../../__mocks__/google-auth-library';
import env from '../../config';
import User from '../../database/models/user';
import { clearDB } from '../../database/queries';
import seedDB from '../../database/seeders';
import loginUser from '../loginUser';
import { mockUser } from '../mockData';

describe('Login User rpc', () => {
  const clientCallback = jest.fn();
  const token: string = 'this is my token';

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
      // @ts-ignore
      await loginUser({ request: { token }}, clientCallback);
      // Ensure verifyIdToken was called with the expected arguments
      expect(verifyIdToken).toHaveBeenCalledWith({ audience: env.GOOGLE_CLIENT_ID, idToken: token });
      // Ensure user is not created
      expect(await User.findUserByEmail(mockUser.email)).toBe(false);
      // Ensure the client callback function is called with an error
      const [[args]] = clientCallback.mock.calls;
      expect(args.message).toEqual('The id token provided is invalid!');
      done();
    });
  });

  describe('should log the user in', () => {
    it('should return error if user is not found', async (done) => {
      // @ts-ignore
      await loginUser({ request: { token }}, clientCallback);
      // Ensure verifyIdToken was called with the expected arguments
      expect(verifyIdToken).toHaveBeenCalledWith({ audience: env.GOOGLE_CLIENT_ID, idToken: token });
      const [, [arg1]] = clientCallback.mock.calls;
      expect(arg1.message).toEqual('User not found!');
      done();
    });

    it('should login a user in the db if token is valid and return user info', async (done) => {
      // @ts-ignore
      // Ensure user is created
      await new User(mockUser).save();
      // @ts-ignore
      await loginUser({ request: { token }}, clientCallback);
      // Ensure verifyIdToken was called with the expected arguments
      expect(verifyIdToken).toHaveBeenCalledWith({ audience: env.GOOGLE_CLIENT_ID, idToken: token });
      const loggedinUser: any = await User.findUserByEmail(mockUser.email);
      expect(loggedinUser).toBeTruthy();
      expect(loggedinUser.email).toEqual(mockUser.email);
      // firstTimeItWasCalled = [ firstArgument = Error, secondArgument=undefined ]
      // secondTimeItWasCalled = [ firstArgument=null, secondArgument=response ]
      // calls = [ firstTimeItWasCalled, secondTimeItWasCalled ]
      const [, , [arg1, arg2]] = clientCallback.mock.calls;
      expect(arg1).toEqual(null);
      expect(arg2.email).toEqual(mockUser.email);
      expect(arg2.token).toBeTruthy();
      done();
    });

    it('should not log in the user if the verification email was sent more than 3 days ago',
    async (done) => {
      const storedUser = await User.findUserByEmail(mockUser.email);
      const mailSentDate = new Date(Date.now() - 345600000).toISOString();
      // @ts-ignore
      await storedUser.updateMailSent({ mailSentDate });
      // @ts-ignore
      await loginUser({ request: { token }}, clientCallback);
      const [, , , [arg1]] = clientCallback.mock.calls;
      expect(arg1.message).toEqual('Your account has not been verified! Click on resend email then verify.');
      done();
    })
  });
});
