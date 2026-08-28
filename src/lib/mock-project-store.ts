import type { Project } from "./types";

const KEY = "dt.crm.projects.v5";

export function hydrateMockProjects(seed: Project[]): Project[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Project[];
    const savedById = new Map(saved.map((project) => [project.id, project]));
    const merged = seed.map((project) => savedById.get(project.id) ?? project);
    for (const project of saved) if (!seed.some((seedProject) => seedProject.id === project.id)) merged.push(project);
    return merged;
  } catch {
    return seed;
  }
}

export function persistMockProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(projects));
}

export function findPersistedMockProject(id: string, seed?: Project | null): Project | null {
  if (typeof window === "undefined") return seed ?? null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed ?? null;
    const saved = JSON.parse(raw) as Project[];
    return saved.find((project) => project.id === id) ?? seed ?? null;
  } catch {
    return seed ?? null;
  }
}
