import Link from 'next/link';

interface AnimeCardProps {
  anime: {
    id: string;
    title: string;
    poster: string;
    rating?: number;
  };
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <Link href={`/anime/${anime.id}`}>
      <div className="group cursor-pointer">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
          <img
            src={anime.poster}
            alt={anime.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        </div>
        <h3 className="text-sm font-medium line-clamp-2">{anime.title}</h3>
        {anime.rating && (
          <p className="text-xs text-gray-400">⭐ {anime.rating.toFixed(1)}</p>
        )}
      </div>
    </Link>
  );
}

