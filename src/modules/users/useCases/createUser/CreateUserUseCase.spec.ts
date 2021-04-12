import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";


describe('CreateUserUser', () => {
  let usersRepository: IUsersRepository;
  let createUserUseCase : CreateUserUseCase;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
  });

  it('should be able create user', async () => {
    const user = {
      name:'User1',
      email:'user1@user.com',
      password:'1234'
    }
    const userCreated = await createUserUseCase.execute(user);

    expect(userCreated).toHaveProperty('id');
    expect(userCreated.name).toBe(user.name);
  });

  it('should not be able create user already exists', async () => {
    const user = {
      name:'User1',
      email:'user1@user.com',
      password:'1234'
    }
    await createUserUseCase.execute(user);

    expect(async () => {
      await createUserUseCase.execute(user);
    }).rejects.toBeInstanceOf(AppError);
  });
})
