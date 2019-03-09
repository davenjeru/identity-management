import { TokenPayload } from 'google-auth-library/build/src/auth/loginticket';
import { ServerUnaryCall } from 'grpc';
import User from '../database/models/user';
import { generateJWT, VerificationEmail, verifyGoogleToken } from '../helpers';

const createUser = async (incomingMessage: ServerUnaryCall<object> , callback: clientCallback) => {
  try {
    // @ts-ignore
    const { request: { token: idToken } } = incomingMessage;
    const identity: TokenPayload = await verifyGoogleToken(idToken);
    let user: any = await User.findUserByEmail(identity.email);
    if (!user) {
      user = new User(identity);
    }
    await user.save();
    const token = generateJWT(user);
    const response = {
      name: user.name,
      email: user.email,
      profile: {
        imageUrl: user.profile.imageUrl,
        lastUpdated: user.profile.lastUpdated,
      },
      token,
    };
    // Callback with the response since mail sending is asynchronous
    callback(null, response);

    // Send the email if the user had not been sent an email
    if (!user.mailSent) {
      const verificationEmail = new VerificationEmail(user);
      verificationEmail.send();
    }
  } catch (error) {
    callback(error);
  }
};

export default createUser;
