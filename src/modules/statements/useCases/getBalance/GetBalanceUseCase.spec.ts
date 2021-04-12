import request from 'supertest';
import { createConnection, Connection } from 'typeorm';
import { app } from '../../../../app';

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
  let connection: Connection

  beforeAll(async () => {
    connection = await createConnection();

    await connection.dropDatabase();
    await connection.runMigrations();
  })

  afterAll(async () => {
    await connection.close();
  })

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

  it('GET /api/v1/statements/balance', async () => {
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

    const { token } = authResponse.body;

    const response = await request(app)
      .get('/api/v1/statements/balance')
      .set({
        authorization: `Bearer ${token}`
      })
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('statement');
    expect(response.body).toHaveProperty('balance');
  })
})
