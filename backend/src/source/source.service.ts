import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

type Paginate = {
  current_page: number;
  total_page: number;
  total_items: number;
  items_per_page: number;
};

type ExternalListResponse<T> = {
  status: 'success';
  paginate: Paginate;
  items: T[];
};

type ExternalFilmDetailResponse = {
  status: 'success';
  movie: any;
};

const DEFAULT_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class SourceService {
  private readonly baseUrl: string;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    this.baseUrl = process.env.NGUONPHIM_API_BASE_URL ?? 'https://phim.nguonc.com/api';
  }

  private async fetchJsonWithRetry<T>(url: string, attempts = 3): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) {
          throw new Error(`NguonPhim API request failed: ${res.status} ${res.statusText}`);
        }
        return (await res.json()) as T;
      } catch (err) {
        lastError = err;
        // Exponential backoff: 300ms, 600ms, 1200ms...
        await new Promise((r) => setTimeout(r, 300 * Math.pow(2, i)));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('NguonPhim API request failed');
  }

  private async cachedFetchJson<T>(cacheKey: string, url: string, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<T> {
    const cached = await this.cacheManager.get<T>(cacheKey);
    if (cached) return cached;

    const data = await this.fetchJsonWithRetry<T>(url);
    await this.cacheManager.set(cacheKey, data, ttlSeconds);
    return data;
  }

  async getFilmListUpdated(page: number) {
    const p = Math.max(1, page);
    const url = `${this.baseUrl}/films/phim-moi-cap-nhat?page=${p}`;
    return this.cachedFetchJson<ExternalListResponse<any>>(`src:films:updated:${p}`, url, 240);
  }

  async getFilmListByDanhSach(slug: string, page: number) {
    const p = Math.max(1, page);
    const url = `${this.baseUrl}/films/danh-sach/${encodeURIComponent(slug)}?page=${p}`;
    return this.cachedFetchJson<ExternalListResponse<any>>(`src:films:danh-sach:${slug}:${p}`, url, 240);
  }

  async getFilmListByTheLoai(slug: string, page: number) {
    const p = Math.max(1, page);
    const url = `${this.baseUrl}/films/the-loai/${encodeURIComponent(slug)}?page=${p}`;
    return this.cachedFetchJson<ExternalListResponse<any>>(`src:films:the-loai:${slug}:${p}`, url, 240);
  }

  async getFilmListByQuocGia(slug: string, page: number) {
    const p = Math.max(1, page);
    const url = `${this.baseUrl}/films/quoc-gia/${encodeURIComponent(slug)}?page=${p}`;
    return this.cachedFetchJson<ExternalListResponse<any>>(`src:films:quoc-gia:${slug}:${p}`, url, 240);
  }

  async getFilmListByNamPhatHanh(slug: string, page: number) {
    const p = Math.max(1, page);
    const url = `${this.baseUrl}/films/nam-phat-hanh/${encodeURIComponent(slug)}?page=${p}`;
    return this.cachedFetchJson<ExternalListResponse<any>>(`src:films:nam-phat-hanh:${slug}:${p}`, url, 240);
  }

  async searchFilms(keyword: string) {
    const keywordTrim = keyword.trim();
    const url = `${this.baseUrl}/films/search?keyword=${encodeURIComponent(keywordTrim)}`;
    return this.cachedFetchJson<ExternalListResponse<any>>(`src:films:search:${keywordTrim}`, url, 240);
  }

  async getFilmDetail(slug: string) {
    const slugTrim = slug.trim();
    const url = `${this.baseUrl}/film/${encodeURIComponent(slugTrim)}`;
    return this.cachedFetchJson<ExternalFilmDetailResponse>(`src:film:${slugTrim}`, url, 300);
  }

  private rewriteM3u8(content: string, originalUrl: string, proxyBase: string): string {
    const baseDir = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);
    return content
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) return line;
        try {
          const absolute = new URL(trimmed, baseDir).href;
          return `${proxyBase}?url=${encodeURIComponent(absolute)}`;
        } catch {
          return line;
        }
      })
      .join('\n');
  }

  async proxyStreamToResponse(originalUrl: string, proxyBase: string, res: any): Promise<void> {
    let response: Response;
    try {
      response = await fetch(originalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://phimmoi.net/',
          'Origin': 'https://phimmoi.net',
        },
      });
    } catch (err: any) {
      res.status(502).json({ error: 'Upstream unreachable', detail: err?.message });
      return;
    }

    if (!response.ok) {
      res.status(response.status).json({ error: `Upstream error: ${response.status}` });
      return;
    }

    const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
    const isM3u8 = contentType.includes('mpegurl') || originalUrl.includes('.m3u8');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    if (isM3u8) {
      const text = await response.text();
      const rewritten = this.rewriteM3u8(text, originalUrl, proxyBase);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(rewritten);
    } else {
      res.setHeader('Content-Type', contentType);
      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
    }
  }
}

