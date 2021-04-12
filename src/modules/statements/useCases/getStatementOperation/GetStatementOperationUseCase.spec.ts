import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../../statements/repositories/IStatementsRepository";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository"
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { AppError } from "../../../../shared/errors/AppError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('GetStatementOperationUseCase', () => {
  let usersRepository: IUsersRepository;
  let statementsRepository: IStatementsRepository;
  let getStatementOperationUseCase: GetStatementOperationUseCase;
  let createUserUseCase: CreateUserUseCase;
  let createStatementUseCase: CreateStatementUseCase;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    getStatementOperationUseCase = new GetStatementOperationUseCase(usersRepository, statementsRepository);
    createUserUseCase = new CreateUserUseCase(usersRepository);
    createStatementUseCase = new CreateStatementUseCase(usersRepository, statementsRepository);
  })

  it('should be possible to get statement information', async () => {
    const user = {
      name: 'user1',
      email: 'user1@user.com',
      password: '1234'
    }

    const userCreated = await createUserUseCase.execute(user);

    const deposit = await createStatementUseCase.execute({
      user_id: userCreated.id || '',
      type: OperationType.DEPOSIT,
      amount: 100,
      description: 'Deposit'
    });

    const statement = await getStatementOperationUseCase.execute({ user_id: userCreated.id || '', statement_id: deposit.id || '' })

    expect(statement).toHaveProperty('id');
  })

  it('should not be possible get statement with invalid user', async () => {
    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: 'non-exist-user',
        statement_id: 'non-exist-statement'
      });
    }).rejects.toBeInstanceOf(AppError)
  })

  it('should not be possible get invalid statement', async () => {
    const user = {
      name: 'user1',
      email: 'user1@user.com',
      password: '1234'
    }

    const userCreated = await createUserUseCase.execute(user);

    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: userCreated.id || '',
        statement_id: 'non-exist-statement'
      });
    }).rejects.toBeInstanceOf(AppError)
  })
})
