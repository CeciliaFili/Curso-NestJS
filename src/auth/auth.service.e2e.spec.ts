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
  });
});
