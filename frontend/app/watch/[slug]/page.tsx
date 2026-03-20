'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Cookies from 'js-cookie';

import VideoPlayer from '@/components/VideoPlayer';
import { sourceAPI, userMediaAPI } from '@/lib/api';

function parseEpisodeNumber(raw: any, fallback = 1): number {
  const n = Number(String(raw ?? '').match(/(\d+)/)?.[1] ?? NaN);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const filmSlug = params.slug as string;

  const episodeNumber = useMemo(() => {
    return parseEpisodeNumber(searchParams.get('ep') ?? 1, 1);
  }, [searchParams]);

  const token = Cookies.get('token');

  const filmDetailQuery = useQuery({
    queryKey: ['film', filmSlug],
    queryFn: () => sourceAPI.getFilmDetail(filmSlug).then((r) => r.data),
    enabled: !!filmSlug,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const progressQuery = useQuery({
    queryKey: ['watch', 'progress', filmSlug, episodeNumber],
    queryFn: () =>
      userMediaAPI
        .getProgress({ filmSlug, episodeNumber })
        .then((r) => r.data),
    enabled: !!token && !!filmSlug && !!episodeNumber,
    retry: 0,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { filmSlug: string; episodeNumber: number; progress: number }) =>
      userMediaAPI.updateProgress(payload).then((r) => r.data),
  });

  const [initialProgress, setInitialProgress] = useState(0);
  // When progress loads, update player seek point.
  useEffect(() => {
    if (progressQuery.data?.progress !== undefined) {
      setInitialProgress(progressQuery.data.progress);
    }
  }, [progressQuery.data?.progress]);

  const currentProgressRef = useRef(0);
  const lastSavedAtRef = useRef(0);
  const lastSavedProgressRef = useRef(0);

  const onProgress = (p: number) => {
    const progress = Math.max(0, Math.min(1, p));
    currentProgressRef.current = progress;

    if (!token) return;

    const now = Date.now();
    const delta = Math.abs(progress - lastSavedProgressRef.current);
    const timeOk = now - lastSavedAtRef.current >= 5000; // 5s
    const deltaOk = delta >= 0.02; // 2% progress change
    if (!timeOk && !deltaOk) return;

    lastSavedAtRef.current = now;
    lastSavedProgressRef.current = progress;

    updateMutation.mutate({ filmSlug, episodeNumber, progress });
  };

  const movie = filmDetailQuery.data?.movie;
  const episodeItems = Array.isArray(movie?.episodes) ? movie.episodes?.[0]?.items ?? [] : [];

  const episode = useMemo(() => {
    const match = (episodeItems as any[]).find((it: any) => parseEpisodeNumber(it?.name) === episodeNumber);
    return match
      ? {
          episodeNumber,
          label: String(match?.name ?? episodeNumber),
          videoUrl: match?.m3u8 as string,
        }
      : null;
  }, [episodeItems, episodeNumber]);

  if (filmDetailQuery.isLoading) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>;
  }

  if (!movie || !episode?.videoUrl) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">Không tìm thấy tập phim</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
            onClick={() => router.push(`/anime/${filmSlug}`)}
          >
            Quay lại
          </button>
          <div className="text-sm text-gray-400">
            {movie.name} - Tập {episodeNumber}
          </div>
        </div>

        <div className="mb-6">
          <VideoPlayer src={episode.videoUrl} initialProgress={initialProgress} onProgress={onProgress} />
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Danh sách tập</h3>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {(episodeItems as any[]).map((it: any) => {
              const n = parseEpisodeNumber(it?.name);
              return (
                <button
                  key={it?.slug ?? n}
                  type="button"
                  className={`p-2 text-center rounded ${
                    n === episodeNumber ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => router.push(`/watch/${filmSlug}?ep=${n}`)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

