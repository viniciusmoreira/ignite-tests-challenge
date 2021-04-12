import request from 'supertest';
import { createConnection, Connection } from 'typeorm';
import { app } from '../../../../app';
import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";

describe('CreateUserUser', () => {
  let usersRepository: IUsersRepository;
  let createUserUseCase: CreateUserUseCase;
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
  });

  it('should be able create user', async () => {
    const user = {
      name: 'User1',
      email: 'user1@user.com',
      password: '1234'
    };

    const userCreated = await createUserUseCase.execute(user);

    expect(userCreated).toHaveProperty('id');
    expect(userCreated.name).toBe(user.name);
  });

  it('should not be able create user already exists', async () => {
    const user = {
      name: 'User1',
      email: 'user1@user.com',
      password: '1234'
    }

    await createUserUseCase.execute(user);

    expect(async () => {
      await createUserUseCase.execute(user);
    }).rejects.toBeInstanceOf(AppError);
  });

  it('POST /api/v1/users', async () => {
    const response = await request(app).post('/api/v1/users')
      .send({
        name: 'User1',
        email: 'user1@user.com',
        password: '1234'
      });

    expect(response.status).toBe(201);
  })
})
