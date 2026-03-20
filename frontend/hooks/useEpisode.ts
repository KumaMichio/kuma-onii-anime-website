import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourceAPI, userMediaAPI } from '@/lib/api';

export const useEpisode = (animeId: string, episodeNumber: number) => {
  // animeId is actually filmSlug in this project.
  return useQuery({
    queryKey: ['episode', animeId, episodeNumber],
    queryFn: async () => {
      const detailRes = await sourceAPI.getFilmDetail(animeId);
      const movie = detailRes.data?.movie;
      const servers = Array.isArray(movie?.episodes) ? movie.episodes : [];
      const firstServer = servers[0];
      const items = Array.isArray(firstServer?.items) ? firstServer.items : [];

      const match = items.find((it: any) => String(it?.name).match(new RegExp(`^${episodeNumber}$|${episodeNumber}`)));
      // Keep shape compatible with old UI: return m3u8 as videoUrl.
      return match
        ? {
            episodeNumber,
            title: match?.name ? String(match.name) : undefined,
            videoUrl: match?.m3u8,
          }
        : null;
    },
    enabled: !!animeId && !!episodeNumber,
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { filmSlug: string; episodeNumber: number; progress: number }) =>
      userMediaAPI
        .updateProgress(payload)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch', 'progress'] });
    },
  });
};

