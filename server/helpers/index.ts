/** Helper functions that are reused throughout the microservice */
// @ts-ignore
import jwt from 'jsonwebtoken';
import mjml2html from 'mjml';
import env from '../config';
import User from '../database/models/user';
import { serverLogger } from '../loggers';
import MailEventEmitter from './mail';
import generateMJMLTemplate from './mailTemplates';

const { SECRET_KEY } = env;

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
      subject: 'Shop-Inc Account Verification',
      html: this.verificationMailTemplate(user.name),
    };
  }

  public send = () => {
    this.mailer.emit('send', this.mailData);
  };

  private verificationMailTemplate = (name: string) => {
    // TODO Create a good verification email template
    const { FRONTEND_URL } = env;
    const verifyURL = `${FRONTEND_URL}/verify/${this.token}`;
    // Generate the MJML template
    const template = generateMJMLTemplate(name, verifyURL);
    // Convert to html
    return mjml2html(template).html;
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
