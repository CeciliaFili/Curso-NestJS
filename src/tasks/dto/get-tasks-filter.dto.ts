import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../task.model';

export class GetTasksFilterDto {
  @IsOptional()
  @IsString()
  search?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: string;
}
