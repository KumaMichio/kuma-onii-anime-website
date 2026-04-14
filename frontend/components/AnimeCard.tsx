import Link from 'next/link';

interface AnimeCardProps {
  anime: {
    id: string;
    title: string;
    poster: string;
    rating?: number;
  };
  progress?: number;
  episodeNumber?: number;
}

/**
 * Movie card — 2:3 aspect ratio poster.
 * Images are clipped inside the poster container (overflow:hidden),
 * so scale transforms NEVER cause the card to overflow its grid cell.
 * Buttons are z-indexed above the overlay and always visible on hover.
 */
export default function AnimeCard({ anime, progress, episodeNumber }: AnimeCardProps) {
  return (
    <Link href={`/anime/${anime.id}`} className="movie-card">

      {/* ── POSTER CONTAINER — 2:3, clips all children ── */}
      <div className="movie-card__poster">

        {/* Actual poster image */}
        <img
          src={anime.poster}
          alt={anime.title}
          className="movie-card__img"
          loading="lazy"
          draggable={false}
        />

        {/* Dark overlay (z-index 1) — fade in on hover */}
        <div className="movie-card__overlay" />

        {/* Play button (z-index 2) — on top of overlay, always visible */}
        <div className="movie-card__play">
          <div className="movie-card__play-btn">
            <svg
              width="18" height="18"
              viewBox="0 0 24 24"
              fill="#000"
              style={{ marginLeft: 2 }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Progress bar — bottom of poster (z-index 3) */}
        {progress !== undefined && progress > 0 && (
          <div className="movie-card__progress">
            <div
              className="movie-card__progress-fill"
              style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
            />
          </div>
        )}

        {/* Episode badge — top-right (z-index 3) */}
        {episodeNumber !== undefined && (
          <div className="movie-card__badge">Tập {episodeNumber}</div>
        )}
      </div>

      {/* ── TITLE AREA — below poster, never overlaps it ── */}
      <div className="movie-card__info">
        <p className="movie-card__title">{anime.title}</p>
      </div>

    </Link>
  );
}
