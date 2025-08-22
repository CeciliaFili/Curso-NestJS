import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { User } from '../src/auth/user.entity';
import request from 'supertest';
import * as bcrypt from 'bcrypt';

describe('AuthService E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const testUserCredentials = { username: 'user2', password: 'password2' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    authService = moduleFixture.get(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      );
    }
  });

  async function createTestUser() {
    const usersRepository = dataSource.getRepository(User);
    const newUser = usersRepository.create({
      username: testUserCredentials.username,
      password: await bcrypt.hash(testUserCredentials.password, 10),
    });
    await usersRepository.save(newUser);
  }

  describe('createUser', () => {
    it('creates an user successfully', async () => {
      const usersRepository = dataSource.getRepository(User);
      const newUser = {
        username: 'user2',
        password: 'password2',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(newUser)
        .expect(201);

      const savedUser = await usersRepository.findOneBy({ username: 'user2' });
      expect(savedUser).toBeDefined();
      expect(savedUser.username).toBe('user2');
    });

    it('creates an user with an existing username and throws an error', async () => {
      const usersRepository = dataSource.getRepository(User);
      await createTestUser();

      const badRequest = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUserCredentials)
        .expect(409);

      expect(badRequest.body.message).toBe('Username already exists');

      const savedUsers = await usersRepository.find();
      expect(savedUsers).toHaveLength(1);
    });
  });

  describe('signIn', () => {
    it('signs in successfully', async () => {
      await createTestUser();

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(testUserCredentials)
        .expect(201);
    });

    it('signs in with wrong testUserCredentials', async () => {
      await createTestUser();

      const wrongCredentials = {
        username: 'user2',
        password: '444',
      };

      const badRequest = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(wrongCredentials)
        .expect(401);

      expect(badRequest.body.message).toBe('Please check your credentials');
    });
  });

  describe('greetings', () => {
    it('Says Hello!', async () => {
      await createTestUser();

      const response = await request(app.getHttpServer())
        .get('/auth/greetings')
        .send(testUserCredentials)
        .expect(200);

      expect(response.text).toBe('Hello!');
    });
  });
});
