import request from 'supertest';
import { createConnection, Connection } from 'typeorm';
import { app } from '../../../../app';

import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../../statements/repositories/IStatementsRepository";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository"
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { AppError } from "../../../../shared/errors/AppError";

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('CreateStatementUseCase', () => {
  let usersRepository: IUsersRepository;
  let statementsRepository: IStatementsRepository;
  let createStatementUseCase: CreateStatementUseCase;
  let createUserUseCase: CreateUserUseCase;
  let connection: Connection;
  let token: string;

  beforeAll(async () => {
    connection = await createConnection();

    await connection.dropDatabase();
    await connection.runMigrations();

    const user = {
      name: 'User1',
      email: 'user1@user.com',
      password: '1234'
    }
    const userResponse = await request(app)
      .post('/api/v1/users')
      .send(user)

    const authResponse = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'user1@user.com',
        password: '1234'
      });

    token = authResponse.body.token;
  })

  afterAll(async () => {
    await connection.close();
  })

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(usersRepository, statementsRepository);
    createUserUseCase = new CreateUserUseCase(usersRepository);
  })

  it('should be possible to deposit', async () => {
    const user = {
      name: 'user1',
      email: 'user1@user.com',
      password: '1234'
    }

    const userCreated = await createUserUseCase.execute(user);

    const statement = await createStatementUseCase.execute({
      user_id: userCreated.id || '',
      type: OperationType.DEPOSIT,
      amount: 100,
      description: 'Deposit'
    });

    expect(statement).toHaveProperty('id');
  })

  it('should be possible to withdraw', async () => {
    const user = {
      name: 'user1',
      email: 'user1@user.com',
      password: '1234'
    }

    const userCreated = await createUserUseCase.execute(user);

    await createStatementUseCase.execute({
      user_id: userCreated.id || '',
      type: OperationType.DEPOSIT,
      amount: 100,
      description: 'Deposit'
    });

    const statement = await createStatementUseCase.execute({
      user_id: userCreated.id || '',
      type: OperationType.WITHDRAW,
      amount: 30,
      description: 'Withdraw'
    });

    expect(statement).toHaveProperty('id');
  })

  it('should not be possible move account with invalid user', async () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: 'non-exist-user',
        type: OperationType.DEPOSIT,
        amount: 100,
        description: 'Deposit'
      });
    }).rejects.toBeInstanceOf(AppError)
  })

  it('should not be possible withdraw with insufficient funds', async () => {
    const user = {
      name: 'user1',
      email: 'user1@user.com',
      password: '1234'
    }

    const userCreated = await createUserUseCase.execute(user);

    expect(async () => {
      await createStatementUseCase.execute({
        user_id: userCreated.id || '',
        type: OperationType.WITHDRAW,
        amount: 100,
        description: 'Withdraw'
      });
    }).rejects.toBeInstanceOf(AppError)
  })

  it('POST /api/v1/statements/deposit', async () => {
    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .set({
        authorization: `Bearer ${token}`
      })
      .send({
        amount: 100,
        description: 'Integration test'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.amount).toBe(100);
  })

  it('POST /api/v1/statements/withdraw', async () => {
    await request(app)
      .post('/api/v1/statements/deposit')
      .set({
        authorization: `Bearer ${token}`
      })
      .send({
        amount: 100,
        description: 'Integration test'
      });

    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .set({
        authorization: `Bearer ${token}`
      })
      .send({
        amount: 50,
        description: 'Integration test'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.amount).toBe(50);
  })
})
