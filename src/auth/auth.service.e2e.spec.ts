import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { User } from '../auth/user.entity';
import request from 'supertest';

describe('AuthService E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;

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
      const newUser = {
        username: 'user2',
        password: 'password2',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(newUser)
        .expect(201);

      const badRequest = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(newUser)
        .expect(409);

      expect(badRequest.body.message).toBe('Username already exists');

      const savedUsers = await usersRepository.find();
      expect(savedUsers).toHaveLength(1);
    });
  });

  describe('signIn', () => {
    it('signs in successfully', async () => {
      const newUser = {
        username: 'user2',
        password: 'password2',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(newUser)
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/signin')
        .send(newUser)
        .expect(201);
    });

    it('signs in with wrong credentials', async () => {
      const newUser = {
        username: 'user2',
        password: 'password2',
      };

      const wrongCredentials = {
        username: 'user2',
        password: '444',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(newUser)
        .expect(201);

      const badRequest = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(wrongCredentials)
        .expect(401);

      expect(badRequest.body.message).toBe('Please check your credentials');
    });
  });
});
