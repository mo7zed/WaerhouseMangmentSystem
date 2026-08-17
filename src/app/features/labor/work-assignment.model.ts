export type WorkTaskType =
  | 'Putaway'
  | 'Pick'
  | 'Pack'
  | 'CycleCount'
  | 'Receiving'
  | 'Transfer'
  | 'QualityInspection';

export type LaborTaskPriority = 'Critical' | 'High' | 'Normal' | 'Low';

export type WorkAssignmentStatus =
  | 'Pending'
  | 'Assigned'
  | 'Accepted'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Failed';

export interface WorkAssignment {
  id: string;
  taskType: WorkTaskType;
  sourceTaskId: string;
  warehouseId: string;
  zoneId?: string | null;
  priority: LaborTaskPriority;
  status: WorkAssignmentStatus;
  requiredSkills: string[];
  assignedOperatorId?: string | null;
  createdAt: string;
  assignedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  dueBy?: string | null;
  failureReason?: string | null;
  notes?: string | null;
}

export interface CreateWorkAssignmentDto {
  taskType: WorkTaskType;
  sourceTaskId: string;
  warehouseId: string;
  priority: LaborTaskPriority;
  requiredSkills: string[];
  zoneId?: string | null;
  dueBy?: string | null;
  notes?: string | null;
}
