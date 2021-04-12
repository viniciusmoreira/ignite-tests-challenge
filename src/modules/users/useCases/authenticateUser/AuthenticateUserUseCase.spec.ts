import request from 'supertest';
import { app } from '../../../../app';
import { createConnection, Connection } from 'typeorm';
import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository"
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";

describe('AuthenticateUserUseCase', () => {
  let usersRepository: IUsersRepository;
  let authenticateUserUseCase: AuthenticateUserUseCase;
  let createUserUseCase: CreateUserUseCase;
  let connection: Connection;

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
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);
  })

  it('should be able to authenticate', async () => {
    const user = {
      name: 'user1',
      email: 'user1@user.com',
      password: '1234'
    }

    await createUserUseCase.execute(user);

    const session = await authenticateUserUseCase.execute({ email: user.email, password: user.password })

    expect(session).toHaveProperty('token');
    expect(session).toHaveProperty('user');
    expect(session.user).toHaveProperty('id');
  })

  it('should not be able to authenticate with invalid email', async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({ email: 'user@user.com', password: '1234' })
    }).rejects.toBeInstanceOf(AppError);
  })

  it('should not be able to authenticate with invalid password', async () => {
    const user = {
      name: 'user1',
      email: 'user1@user.com',
      password: '1234'
    }

    await createUserUseCase.execute(user);

    expect(async () => {
      await authenticateUserUseCase.execute({ email: user.email, password: '4321' })
    }).rejects.toBeInstanceOf(AppError);
  })

  it('POST /api/v1/sessions', async () => {
    const userResponse = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'User1',
        email: 'user1@user.com',
        password: '1234'
      })

    const response = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'user1@user.com',
        password: '1234'
      });

    expect(response.body).toHaveProperty('token');
  })
})
