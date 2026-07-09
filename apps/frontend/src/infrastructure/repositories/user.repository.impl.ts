import { UserDatasourceImpl } from '../datasources';
import { FindAllUsers, InviteUser, DeleteUser } from '../../application/use-cases/user';

const userRepository = new UserDatasourceImpl();

export const userUseCases = {
  findAll: new FindAllUsers(userRepository),
  invite:  new InviteUser(userRepository),
  delete:  new DeleteUser(userRepository),
};
