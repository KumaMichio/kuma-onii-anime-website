import { useQuery } from '@tanstack/react-query';
import { sourceAPI } from '@/lib/api';

export const useAnimes = (page = 1, limit = 20, search?: string) => {
  return useQuery({
    queryKey: ['films', page, search],
    queryFn: () => {
      if (search && search.trim()) {
        return sourceAPI.searchFilms(search).then((res) => res.data);
      }
      return sourceAPI.getFilmsUpdated(page).then((res) => res.data);
    },
  });
};

export const useAnime = (id: string) => {
  return useQuery({
    queryKey: ['film', id],
    queryFn: () => sourceAPI.getFilmDetail(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const usePopularAnimes = (limit = 10) => {
  return useQuery({
    // External API currently has no "popular" endpoint; we use updated as placeholder.
    queryKey: ['films', 'updated', 'popular', limit],
    queryFn: () => sourceAPI.getFilmsUpdated(1).then((res) => res.data),
  });
};

