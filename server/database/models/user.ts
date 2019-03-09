import db from '../index';
import Profile from './profile';
import Role, { administrator, buyer } from './role';

class User {
  [index: string]: any;

  /**
   * Returns an instance of User if a user with the given email was found, else false
   * @param email {String} The user's email
   */
  public static async findUserByEmail(email: string) {
    try {
      // TODO Return only most recent profile.
      const { records } = await db.run(
        `MATCH (u:User { email: $email })-[relIs:IS]->(role:Role),
                         (u)-[:HAS]->(p:Profile)
                   RETURN u.name AS name, u.email AS email, p.imageUrl AS picture, p.lastUpdated AS lastUpdated,
                    relIs.verified AS verified, relIs.mailSent AS mailSent,
                     relIs.mailSentDate AS mailSentDate, role.roleName as roleName`
        , { email });
      if (!records.length) {
        return false;
      }
      const [record] = records;
      const params = {
        name: record.get('name'),
        email: record.get('email'),
        verified: record.get('verified'),
        mailSent: record.get('mailSent'),
        mailSentDate: record.get('mailSentDate'),
        roleName: record.get('roleName'),
        picture: record.get('picture'),
        lastUpdated: record.get('lastUpdated'),
      };
      return new User(params);
    } catch (e) {
      /* istanbul ignore next */
      throw e;
    }
  }

  public name: string;
  public email: string;
  public profile: Profile;
  public role: Role;
  public verified: boolean;
  public mailSent: boolean;
  public mailSentDate: string;

  /**
   * The class that represents a user
   * @param identity: {UserConstructor} The details that the user should have
   */
  constructor(identity: UserConstructor) {
    this.name = identity.name;
    this.email = identity.email;
    this.profile = new Profile(identity.picture, identity.lastUpdated);
    // Role is set to buyer by default
    this.role = identity.roleName ? new Role(identity.roleName) : buyer;
    this.verified = identity.verified || false;
    this.mailSent = identity.mailSent || false;
    this.mailSentDate = identity.mailSentDate || '';
  }

  public async save() {
    const params: object = this.serialize();
    try {
      // If this user exists, exit
      const existingUser = await User.findUserByEmail(this.email);
      if (existingUser) {
        return;
      }
      // Create the User,
      // Create the Profile,
      // Create the relationship between the User and their Profile,
      // Create the relationship between the User and their Role.
      await db.run(
        `
        CREATE
          (user: User { name: $name, email: $email }),
          (profile: Profile { imageUrl: $imageUrl, lastUpdated: $lastUpdated }),
          (user)-[:HAS]->(profile)
        WITH user AS u
        MATCH (r:Role { roleName: $roleName })
        CREATE (u)-[:IS { verified: $verified, mailSent: $mailSent, mailSentDate: $mailSentDate }]->(r);
          `, params);
    } catch (e) {
      // TODO Handle exception
      /* istanbul ignore next */
      throw e;
    }
  }

  public serialize = () => ({
    email: this.email,
    name: this.name,
    imageUrl: this.profile.imageUrl,
    lastUpdated: this.profile.lastUpdated,
    roleName: this.role.roleName,
    verified: this.verified,
    mailSent: this.mailSent,
    mailSentDate: this.mailSentDate,
  });

  public updateMailSent = async () => {
    try {
      await db.run(
        'MATCH (: User { email: $email })-[r:IS]->(:Role { roleName: $roleName }) SET r += $props;',
        {
          ...this.serialize(),
          props: {
            mailSent: true,
            mailSentDate: new Date().toISOString(),
          },
        });
    } catch (e) {
      // TODO Handle exception
      /* istanbul ignore next */
      throw e;
    }
  };
}

export class Administrator extends User {
  constructor(adminIdentity: UserConstructor) {
    super(adminIdentity);
    this.role = administrator;
    this.verified = true;
  }
}
export default User;
