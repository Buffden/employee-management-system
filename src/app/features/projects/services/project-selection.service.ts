import { Injectable } from '@angular/core';
import { Project } from '../../../shared/models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectSelectionService {
  private selectedProject: Project | null = null;

  setProject(project: Project) {
    this.selectedProject = project;
  }

  getProject(): Project | null {
    return this.selectedProject;
  }

  clear() {
    this.selectedProject = null;
  }
} 