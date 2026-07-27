import { useCallback, useEffect, useSyncExternalStore } from "react";
import { loadArchiveItems, loadEditorialIndex, loadProjects, type ArchiveItem, type EditorialIndex } from "../services/content";
import type { ProjectRecord } from "../lib/data/schema";

type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
};

function createCachedResource<T>(loader: () => Promise<T>) {
  let state: ResourceState<T> = { data: null, loading: true, error: "" };
  let promise: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const update = (patch: Partial<ResourceState<T>>) => {
    state = { ...state, ...patch };
    emit();
  };
  const load = () => {
    if (state.data || promise) return;
    update({ loading: true, error: "" });
    promise = loader()
      .then((data) => update({ data, loading: false, error: "" }))
      .catch((reason: unknown) => {
        update({ loading: false, error: reason instanceof Error ? reason.message : String(reason) });
      })
      .finally(() => {
        promise = null;
      });
  };
  const retry = () => {
    if (promise) return;
    state = { data: null, loading: true, error: "" };
    emit();
    load();
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    load,
    retry
  };
}

function useCachedResource<T>(resource: ReturnType<typeof createCachedResource<T>>) {
  const state = useSyncExternalStore(resource.subscribe, resource.getSnapshot, resource.getSnapshot);
  useEffect(() => {
    resource.load();
  }, [resource]);
  const retry = useCallback(() => resource.retry(), [resource]);
  return { ...state, retry };
}

const archiveResource = createCachedResource<ArchiveItem[]>(loadArchiveItems);
const projectResource = createCachedResource<ProjectRecord[]>(loadProjects);
const editorialResource = createCachedResource<EditorialIndex>(loadEditorialIndex);

export function useArchive() {
  const { data, ...state } = useCachedResource(archiveResource);
  return { items: data ?? [], ...state };
}

export function useProjects() {
  const { data, ...state } = useCachedResource(projectResource);
  return { projects: data ?? [], ...state };
}

export function useEditorial() {
  const { data, ...state } = useCachedResource(editorialResource);
  return { editorial: data, ...state };
}
