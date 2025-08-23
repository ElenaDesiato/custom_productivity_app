export type TaskList = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  name: string;
  details?: string;
  listId: string;
  completed: boolean;
  archived: boolean;
  deletedList?: boolean;
  completedAt?: string;
  dueDate?: string;
};
