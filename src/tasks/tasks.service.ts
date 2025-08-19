import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { Repository } from 'typeorm';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TasksService {
  private logger = new Logger('TasksService', { timestamp: true });
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const query = this.tasksRepository.createQueryBuilder('task');
    const { status, search } = filterDto;
    query.where({ user });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (search) {
      query.andWhere(
        '(task.description LIKE :search OR task.title LIKE :search)',
        { search: `%${search}` },
      );
    }
    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failet to get tasks for user "${user.username}". Filters: ${JSON.stringify(filterDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;

    const task = this.tasksRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });

    await this.tasksRepository.save(task);

    return task;
  }
  async getTaskById(id: string, user: User): Promise<Task> {
    const found = await this.tasksRepository.findOne({ where: { id, user } });
    if (!found) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return found;
  }

  async deleteTask(id: string, user: User): Promise<void> {
    const result = await this.tasksRepository.delete({ id, user });
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<string> {
    const result = await this.tasksRepository.update({ id, user }, { status });

    if (!result.affected || result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return `Task with ID "${id}" updated successfully`;
  }
}
