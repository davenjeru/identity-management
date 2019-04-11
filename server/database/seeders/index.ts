import env from '../../config';
import { administrator, buyer, seller } from '../models/role';
import { Administrator } from '../models/user';

export const seedRoles = async () => {
  await administrator.save();
  await buyer.save();
  await seller.save();
};

export const seedAdminUser = async () => {
  const { ADMINISTRATOR_EMAIL, ADMINISTRATOR_PICTURE, ADMINISTRATOR_NAME } = env;
  const adminUser = new Administrator({
    email: ADMINISTRATOR_EMAIL,
    name: ADMINISTRATOR_NAME,
    picture: ADMINISTRATOR_PICTURE,
  });
  await adminUser.save();
};

const seedGraphDB = async () => {
  await seedRoles();
  await seedAdminUser();
};

export default seedGraphDB;

if (require.main === module) {
  /* istanbul ignore next */
  process.on('unhandledRejection', (reason) => {
    console.error(reason);
    process.exit();
  });
  /* istanbul ignore next */
  seedGraphDB().then(() => process.exit(0));
}
