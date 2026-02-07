import { Priority } from '../contexts/TodoContext';

export interface PresetTask {
  id: string; // Unique ID for the task within the preset
  text: string;
  priority?: Priority;
  dueHoursOffset?: number; // Offset in hours from the current time
  checklist?: string[]; // List of checklist item texts
}

export interface Preset {
  id: string;
  name: string;
  tasks: PresetTask[];
  createdAt: Date;
}
