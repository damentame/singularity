import { MoodBoardImage } from '@/components/MomentMoodBoard';

const STORAGE_KEY = 'theone_moodboards_v1';

interface MoodBoardStore {
  [momentId: string]: MoodBoardImage[];
}

const loadStore = (): MoodBoardStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

const saveStore = (store: MoodBoardStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const getMoodBoardImages = (momentId: string): MoodBoardImage[] => {
  const store = loadStore();
  return store[momentId] || [];
};

export const setMoodBoardImages = (momentId: string, images: MoodBoardImage[]) => {
  const store = loadStore();
  store[momentId] = images;
  saveStore(store);
};

export const deleteMoodBoard = (momentId: string) => {
  const store = loadStore();
  delete store[momentId];
  saveStore(store);
};

export const getMoodBoardImageCount = (momentId: string): number => {
  const store = loadStore();
  return (store[momentId] || []).length;
};

export const getAllMoodBoardCounts = (): Record<string, number> => {
  const store = loadStore();
  const counts: Record<string, number> = {};
  Object.keys(store).forEach(key => {
    counts[key] = store[key].length;
  });
  return counts;
};
