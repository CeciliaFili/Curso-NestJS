import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../task-status.enum';

export class GetTasksFilterDto {
  @IsOptional()
  @IsString()
  search?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: string;
}
