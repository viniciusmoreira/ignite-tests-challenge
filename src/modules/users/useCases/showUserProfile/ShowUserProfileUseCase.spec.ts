import request from 'supertest';
import { app } from '../../../../app';
import { createConnection, Connection } from 'typeorm';
import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

describe('ShowUserProfileUseCase', () => {
  let usersRepository: IUsersRepository;
  let createUserUseCase: CreateUserUseCase;
  let showUserProfileUseCase: ShowUserProfileUseCase;
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
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepository);
  })

  it('should be able to show user profile', async () => {
    const user = {
      name: 'user1',
      email: 'user1@user.com',
      password: '1234'
    }

    const userCreated = await createUserUseCase.execute(user);

    const profile = await showUserProfileUseCase.execute(userCreated.id || '');

    expect(profile).toHaveProperty('id');
  })

  it('should not be able to show user profile from nonexistent user ', async () => {
    expect(async () => {
      await showUserProfileUseCase.execute('nonexistent-id');
    }).rejects.toBeInstanceOf(AppError);
  })

  it('GET /api/v1/profile', async () => {
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
      .get('/api/v1/profile')
      .set({
        authorization: `Bearer ${token}`
      })
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(user.name)
  })
})
