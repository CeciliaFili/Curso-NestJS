import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

const mockTasksRepository = () => ({
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
});

describe('TasksService', () => {
  let tasksService: TasksService;
  let tasksRepository: jest.Mocked<Repository<Task>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useFactory: mockTasksRepository },
      ],
    }).compile();

    tasksService = module.get(TasksService);
    tasksRepository = module.get(getRepositoryToken(Task));
  });

  describe('getTasks', () => {
    it('calls getTasks and returns the result', async () => {
      tasksRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await tasksService.getTasks({}, { id: '1' } as any);
      expect(result).toEqual([]);
      expect(tasksRepository.createQueryBuilder).toHaveBeenCalled();
    });
    it('returns tasks filtered by status and search', async () => {
      const tasks = [
        {
          id: '1',
          title: 'Tarea 1',
          description: 'Desc 1',
          status: 'OPEN',
          user: { id: '1' },
        },
        {
          id: '2',
          title: 'Tarea 2',
          description: 'Desc 2',
          status: 'DONE',
          user: { id: '1' },
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockImplementation(() => {
          const filterDto = mockQueryBuilder.filterDto;
          return Promise.resolve(
            tasks.filter(
              (task) =>
                (!filterDto.status || task.status === filterDto.status) &&
                (!filterDto.search ||
                  task.title.includes(filterDto.search) ||
                  task.description.includes(filterDto.search)),
            ),
          );
        }),
        filterDto: {} as any,
      };

      tasksRepository.createQueryBuilder.mockImplementation(
        () => mockQueryBuilder as any,
      );

      const user = { id: '1' } as any;

      mockQueryBuilder.filterDto = { status: 'OPEN', search: 'Tarea' };
      let result = await tasksService.getTasks(
        mockQueryBuilder.filterDto,
        user,
      );
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Tarea 1');
    });
  });
  describe('getTaskById', () => {
    it('calls getTaskById and return a Task', async () => {
      const task = {
        id: '123',
        title: 'mitarea',
        status: 'miestado',
        description: 'midescripcion',
        user: { id: '1' },
      };

      tasksRepository.findOne.mockResolvedValue(task);

      const result = await tasksService.getTaskById('123', { id: '1' });

      expect(task).toEqual(result);
    });
  });
});
