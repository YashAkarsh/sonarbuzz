import { useLocalStore } from '../services/database';

export const useLocalContext = () => {
  return useLocalStore();
};
