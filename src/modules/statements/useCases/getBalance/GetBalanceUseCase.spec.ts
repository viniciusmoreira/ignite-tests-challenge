import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

describe('GetBalanceUseCase', () => {
  let usersRepository: IUsersRepository;
  let createUserUseCase: CreateUserUseCase;
  let statementsRepository: IStatementsRepository;
  let getBalanceUseCase: GetBalanceUseCase;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
    statementsRepository = new InMemoryStatementsRepository();
    getBalanceUseCase = new GetBalanceUseCase(statementsRepository, usersRepository);
  })

  it('should be able to get user balance', async() => {
    const user = {
      name: 'user1',
      email: 'user1@user.com',
      password: '1234'
    }

    const userCreated = await createUserUseCase.execute(user);

    const balance = await getBalanceUseCase.execute({user_id: userCreated.id || ''});

    expect(balance).toHaveProperty('statement');
    expect(balance).toHaveProperty('balance');
  })

  it('should not be able to get balance from nonexistent user ', async() => {
    expect(async () => {
      const balance = await getBalanceUseCase.execute({user_id: 'nonexistent-id'});
    }).rejects.toBeInstanceOf(AppError);
  })
})
