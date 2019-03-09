/** Helper functions that are reused throughout the microservice */
// @ts-ignore
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import env from '../config';
import User from '../database/models/user';
import {InvalidIdToken} from '../exceptions';
import { serverLogger } from '../loggers';
import MailEventEmitter from './mail';

const { SECRET_KEY, GOOGLE_CLIENT_ID } = env;

export const generateJWT = (user: User, expiresAfter?: number) => {
  return jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: expiresAfter || 60 * 60 * 24 });
};

export class VerificationEmail {
  private readonly mailData: MailData;
  private readonly mailer: MailEventEmitter;
  private readonly user: User;
  private readonly token: string;

  constructor(user: User) {
    this.mailer = new MailEventEmitter();
    // TODO Handle mail sending failure
    this.mailer.on('success', this.handleSendSuccess);
    this.mailer.on('failure', this.handleSendFailure);
    this.user = user;
    this.token = generateJWT(user, 60 * 60 * 24 * 3);
    this.mailData = {
      to: user.email,
      subject: 'Shop-Inc Account Verification Email',
      html: this.verificationMailTemplate(user.name),
    };
  }

  public send = () => {
    this.mailer.emit('send', this.mailData);
  };

  private verificationMailTemplate = (name: string) => {
    // TODO Create a good verification email template
    return `<div>${name} ${this.token}</div>`;
  };

  private handleSendSuccess = () => {
    // Update user verified status
    this.user.updateMailSent();
  };

  private handleSendFailure = (mailData: MailData) => {
    // TODO Handle sending failure
    serverLogger(`Verification email for ${mailData.to} was not sent.`);
  };
}

/**
 * Verifies the id token
 * @param idToken
 */
export const verifyGoogleToken = async (idToken: string) => {
  try {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (e) {
    throw new InvalidIdToken();
  }
};
