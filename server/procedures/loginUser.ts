import {TokenPayload} from 'google-auth-library/build/src/auth/loginticket';
import {ServerUnaryCall} from 'grpc';
import User from '../database/models/user';
import { UserNotFound } from '../exceptions';
import { generateJWT } from '../helpers';
import { verifyGoogleToken } from '../helpers';

const loginUser = async (incomingMessage: ServerUnaryCall<object> , callback: clientCallback) => {
  try {
    // @ts-ignore
    const { request: { token: idToken } } = incomingMessage;
    const identity: TokenPayload = await verifyGoogleToken(idToken);
    const user: any = await User.findUserByEmail(identity.email);
    if (!user) {
      return callback(new UserNotFound());
    }
    await user.checkVerifiedUser();
    const token = generateJWT(user);
    const {
      name, email, profile: { imageUrl, lastUpdated },
    } = user;
    const response = {
      name,
      email,
      profile: {
        imageUrl,
        lastUpdated,
      },
      token,
    };
    callback(null, response);
  } catch (error) {
    callback(error);
  }
};

export default loginUser;
