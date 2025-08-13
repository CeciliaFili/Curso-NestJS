import { TaskStatus } from '../task.model';

export class GetTasksFilterDto {
  search?: TaskStatus;
  status?: string;
}
