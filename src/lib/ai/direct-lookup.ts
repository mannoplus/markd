/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getMovieDetails,
  getTVDetails,
  getWatchProviders,
  getMediaTrailer,
} from '@/lib/tmdb';
import { fetchStrictlyFreeQuota } from '@/app/actions/discover';
import type { AiChatContext, AiChatResponse, AiMediaPoster, AiMediaVideo, AiWatchProvidersData } from './types';

export class DirectLookupEngine {
  /**
   * Evaluates whether a user query is a simple factual request that can be answered
   * directly via local state or TMDB API without invoking an LLM.
   */
  public static isDirectQuery(query: string): boolean {
    const q = query.trim().toLowerCase();

    // 1. Free to watch queries
    if (
      q.includes('free to watch') ||
      q.includes('free movie') ||
      q.includes('free movies') ||
      q.includes('free show') ||
      q.includes('free shows') ||
      q.includes('free tv') ||
      q.includes('free stream') ||
      q.includes('what is free') ||
      q.includes('what are free') ||
      q.includes('what can i watch for free') ||
      q.includes('watch for free') ||
      q.includes('stream for free') ||
      q.includes('free content') ||
      q.includes('免費看') ||
      q.includes('免費電影') ||
      q.includes('免費影集') ||
      q.includes('免費線上看') ||
      q.includes('有哪些免費') ||
      q.includes('免費')
    ) {
      return true;
    }

    // 2. Director queries
    if (
      q.includes('who is the director') ||
      q.includes('who directed') ||
      q.includes('directed by') ||
      q === 'director' ||
      q.includes('the director') ||
      q.includes('導演是誰') ||
      q.includes('誰導演') ||
      q.includes('誰執導') ||
      q === '導演'
    ) {
      return true;
    }

    // 3. Cast / Actors queries
    if (
      q.includes('who is in the cast') ||
      q.includes('cast list') ||
      q.includes('who stars in') ||
      q.includes('actors in this') ||
      q.includes('cast and crew') ||
      q === 'cast' ||
      q === 'actors' ||
      q.includes('演員名單') ||
      q.includes('主演是誰') ||
      q.includes('誰演的') ||
      q.includes('主要演員') ||
      q === '演員' ||
      q === '卡司'
    ) {
      return true;
    }

    // 4. Synopsis / Plot queries
    if (
      q.includes('show me the synopsis') ||
      q.includes('what is the synopsis') ||
      q.includes('what is the plot') ||
      q.includes('plot summary') ||
      q.includes('what is this about') ||
      q === 'synopsis' ||
      q === 'plot' ||
      q === 'overview' ||
      q.includes('劇情大綱') ||
      q.includes('故事大綱') ||
      q.includes('劇情簡介') ||
      q.includes('在講什麼') ||
      q === '大綱' ||
      q === '簡介'
    ) {
      return true;
    }

    // 5. Where to stream / Watch provider queries
    if (
      q.includes('where can i stream') ||
      q.includes('where to stream') ||
      q.includes('where can i watch') ||
      q.includes('where to watch') ||
      q.includes('streaming platforms') ||
      q.includes('which platform') ||
      q.includes('which streaming') ||
      q.includes('線上哪裡看') ||
      q.includes('哪裡可以看') ||
      q.includes('在哪裡看') ||
      q.includes('播放平台') ||
      q.includes('串流平台')
    ) {
      return true;
    }

    // 6. Trailer queries
    if (
      q.includes('show me the trailer') ||
      q.includes('play trailer') ||
      q.includes('watch trailer') ||
      q.includes('show trailer') ||
      q.includes('the trailer') ||
      q === 'trailer' ||
      q === 'teaser' ||
      q.includes('看預告') ||
      q.includes('預告片') ||
      q.includes('播放預告') ||
      q === '預告'
    ) {
      return true;
    }

    return false;
  }

  /**
   * Executes the direct lookup against TMDB or local state
   */
  public static async execute(
    query: string,
    contextInfo?: AiChatContext,
    locale: string = 'en',
    region: string = 'US'
  ): Promise<AiChatResponse | null> {
    const q = query.trim().toLowerCase();
    const isZh = locale === 'zh-TW' || locale.startsWith('zh');
    const mediaId = contextInfo?.id;
    const mediaType = contextInfo?.type || 'movie';
    const title = contextInfo?.title || (isZh ? '該作品' : 'this title');

    // -------------------------------------------------------------
    // 1. FREE TO WATCH DIRECT QUERY (Zero LLM Cost)
    // -------------------------------------------------------------
    if (
      q.includes('free to watch') ||
      q.includes('free movie') ||
      q.includes('free movies') ||
      q.includes('free show') ||
      q.includes('free shows') ||
      q.includes('free tv') ||
      q.includes('free stream') ||
      q.includes('what is free') ||
      q.includes('what are free') ||
      q.includes('what can i watch for free') ||
      q.includes('watch for free') ||
      q.includes('stream for free') ||
      q.includes('free content') ||
      q.includes('免費')
    ) {
      try {
        const [freeMovies, freeShows] = await Promise.all([
          fetchStrictlyFreeQuota('movie', 1, 6, region, isZh ? 'zh-TW' : 'en-US').catch(() => []),
          fetchStrictlyFreeQuota('tv', 1, 4, region, isZh ? 'zh-TW' : 'en-US').catch(() => []),
        ]);

        const posters: AiMediaPoster[] = [
          ...freeMovies.map((m: any) => ({
            id: m.id,
            title: m.title || m.name,
            posterPath: m.poster_path,
            backdropPath: m.backdrop_path,
            mediaType: 'movie' as const,
            year: (m.release_date || '').substring(0, 4),
            rating: m.vote_average,
            overview: m.overview,
          })),
          ...freeShows.map((s: any) => ({
            id: s.id,
            title: s.name || s.title,
            posterPath: s.poster_path,
            backdropPath: s.backdrop_path,
            mediaType: 'tv' as const,
            year: (s.first_air_date || '').substring(0, 4),
            rating: s.vote_average,
            overview: s.overview,
          })),
        ];

        const allTitles = posters.map((p) => p.title).filter(Boolean);
        const listText = allTitles.map((titleStr, idx) => `${idx + 1}. ${titleStr}`).join('\n');

        const greeting = isZh
          ? '以下為熱門免費觀看的電影與影集：'
          : 'Here are popular free-to-watch movies and TV shows:';

        const text = allTitles.length > 0
          ? `${greeting}\n${listText}`
          : (isZh ? '目前暫無可免費觀看的熱門內容。' : 'No free-to-watch titles found at this moment.');

        return {
          text,
          posters,
          provider: 'direct-api',
          tier: 1,
        };
      } catch (e) {
        console.error('Failed free to watch direct lookup:', e);
      }
    }

    // -------------------------------------------------------------
    // 2. DIRECTOR / CREATOR DIRECT QUERY
    // -------------------------------------------------------------
    if (
      q.includes('who is the director') ||
      q.includes('who directed') ||
      q.includes('directed by') ||
      q === 'director' ||
      q.includes('the director') ||
      q.includes('導演') ||
      q.includes('誰導') ||
      q.includes('誰執導')
    ) {
      if (contextInfo?.director) {
        const text = isZh
          ? `🎬 **《${title}》的導演為：** **${contextInfo.director}**`
          : `🎬 **The director of *${title}* is:** **${contextInfo.director}**`;
        return { text, provider: 'direct-api', tier: 1 };
      }

      if (mediaId) {
        try {
          if (mediaType === 'movie') {
            const details = await getMovieDetails(mediaId);
            const directorName = details.director?.name || details.crew?.find((c) => c.job === 'Director')?.name;
            if (directorName) {
              const text = isZh
                ? `🎬 **《${title}》的導演為：** **${directorName}**`
                : `🎬 **The director of *${title}* is:** **${directorName}**`;
              return { text, provider: 'direct-api', tier: 1 };
            }
          } else {
            const tvDetails = await getTVDetails(mediaId);
            const creatorName = tvDetails.director?.name;
            if (creatorName) {
              const text = isZh
                ? `📺 **《${title}》的創作者/主創為：** **${creatorName}**`
                : `📺 **The creator of *${title}* is:** **${creatorName}**`;
              return { text, provider: 'direct-api', tier: 1 };
            }
          }
        } catch (e) {
          console.warn('Failed director lookup:', e);
        }
      }
    }

    // -------------------------------------------------------------
    // 3. CAST / ACTORS DIRECT QUERY
    // -------------------------------------------------------------
    if (
      q.includes('who is in the cast') ||
      q.includes('cast list') ||
      q.includes('who stars in') ||
      q.includes('actors in this') ||
      q === 'cast' ||
      q === 'actors' ||
      q.includes('演員') ||
      q.includes('主演') ||
      q.includes('誰演') ||
      q.includes('卡司')
    ) {
      if (contextInfo?.cast && contextInfo.cast.length > 0) {
        const castList = contextInfo.cast.slice(0, 8).map((c) => `• **${c}**`).join('\n');
        const text = isZh
          ? `👥 **《${title}》的主要主演名單：**\n\n${castList}`
          : `👥 **Top Cast for *${title}*:**\n\n${castList}`;
        return { text, provider: 'direct-api', tier: 1 };
      }

      if (mediaId) {
        try {
          if (mediaType === 'movie') {
            const details = await getMovieDetails(mediaId);
            const cast = details.cast || [];
            if (cast.length > 0) {
              const castList = cast
                .slice(0, 8)
                .map((c) => `• **${c.name}** ${c.character ? `飾演 *${c.character}*` : ''}`)
                .join('\n');
              const text = isZh
                ? `👥 **《${title}》的主要演員與飾演角色：**\n\n${castList}`
                : `👥 **Key Cast members for *${title}*:**\n\n${castList}`;
              return { text, provider: 'direct-api', tier: 1 };
            }
          } else {
            const tvDetails = await getTVDetails(mediaId);
            const cast = tvDetails.cast || [];
            if (cast.length > 0) {
              const castList = cast
                .slice(0, 8)
                .map((c: any) => `• **${c.name}** ${c.character ? `飾演 *${c.character}*` : ''}`)
                .join('\n');
              const text = isZh
                ? `👥 **《${title}》的主要演員陣容：**\n\n${castList}`
                : `👥 **Key Cast for *${title}*:**\n\n${castList}`;
              return { text, provider: 'direct-api', tier: 1 };
            }
          }
        } catch (e) {
          console.warn('Failed cast lookup:', e);
        }
      }
    }

    // -------------------------------------------------------------
    // 4. SYNOPSIS / PLOT OVERVIEW DIRECT QUERY
    // -------------------------------------------------------------
    if (
      q.includes('show me the synopsis') ||
      q.includes('what is the synopsis') ||
      q.includes('what is the plot') ||
      q.includes('plot summary') ||
      q.includes('what is this about') ||
      q === 'synopsis' ||
      q === 'plot' ||
      q === 'overview' ||
      q.includes('劇情') ||
      q.includes('故事大綱') ||
      q.includes('簡介') ||
      q.includes('在講什麼')
    ) {
      if (contextInfo?.overview) {
        const text = isZh
          ? `📖 **《${title}》劇情大綱：**\n\n${contextInfo.overview}`
          : `📖 **Synopsis for *${title}*:**\n\n${contextInfo.overview}`;
        return { text, provider: 'direct-api', tier: 1 };
      }

      if (mediaId) {
        try {
          if (mediaType === 'movie') {
            const details = await getMovieDetails(mediaId);
            if (details.details.overview) {
              const text = isZh
                ? `📖 **《${title}》劇情大綱：**\n\n${details.details.overview}`
                : `📖 **Synopsis for *${title}*:**\n\n${details.details.overview}`;
              return { text, provider: 'direct-api', tier: 1 };
            }
          } else {
            const tvDetails = await getTVDetails(mediaId);
            if (tvDetails.details?.overview) {
              const text = isZh
                ? `📖 **《${title}》劇情大綱：**\n\n${tvDetails.details.overview}`
                : `📖 **Synopsis for *${title}*:**\n\n${tvDetails.details.overview}`;
              return { text, provider: 'direct-api', tier: 1 };
            }
          }
        } catch (e) {
          console.warn('Failed overview lookup:', e);
        }
      }
    }

    // -------------------------------------------------------------
    // 5. WHERE TO STREAM / WATCH PROVIDERS DIRECT QUERY
    // -------------------------------------------------------------
    if (
      q.includes('where can i stream') ||
      q.includes('where to stream') ||
      q.includes('where can i watch') ||
      q.includes('where to watch') ||
      q.includes('streaming platforms') ||
      q.includes('線上哪裡看') ||
      q.includes('哪裡可以看') ||
      q.includes('播放平台') ||
      q.includes('串流')
    ) {
      if (mediaId) {
        try {
          const providerData = await getWatchProviders(mediaId, mediaType, region);
          if (providerData) {
            const watchProviders: AiWatchProvidersData = {
              link: providerData.link,
              flatrate: providerData.flatrate,
              rent: providerData.rent,
              buy: providerData.buy,
              free: providerData.free,
              ads: providerData.ads,
            };

            const flatrateList = (providerData.flatrate || []).map((p: any) => p.provider_name).join(', ');
            const rentList = (providerData.rent || []).map((p: any) => p.provider_name).join(', ');
            const freeList = (providerData.free || providerData.ads || []).map((p: any) => p.provider_name).join(', ');

            let providerSummary = '';
            if (flatrateList) {
              providerSummary += isZh ? `\n• **訂閱串流 (Subscription):** ${flatrateList}` : `\n• **Streaming (Subscription):** ${flatrateList}`;
            }
            if (freeList) {
              providerSummary += isZh ? `\n• **免費/廣告支援 (Free / Ads):** ${freeList}` : `\n• **Free with Ads:** ${freeList}`;
            }
            if (rentList) {
              providerSummary += isZh ? `\n• **單次租借/購買 (Rent/Buy):** ${rentList}` : `\n• **Rent / Buy:** ${rentList}`;
            }

            if (!providerSummary) {
              providerSummary = isZh
                ? `\n目前暫無主要串流平台直播資訊，可點擊詳情確認數位上架管道。`
                : `\nCurrently no active direct subscription stream listed. Check the title page for rental/digital options.`;
            }

            const text = isZh
              ? `📺 **《${title}》的觀看管道：**\n${providerSummary}`
              : `📺 **Where to watch *${title}*:**\n${providerSummary}`;

            return {
              text,
              watchProviders,
              provider: 'direct-api',
              tier: 1,
            };
          }
        } catch (e) {
          console.warn('Failed watch providers lookup:', e);
        }
      }
    }

    // -------------------------------------------------------------
    // 6. TRAILER / TEASER DIRECT QUERY
    // -------------------------------------------------------------
    if (
      q.includes('show me the trailer') ||
      q.includes('play trailer') ||
      q.includes('watch trailer') ||
      q.includes('show trailer') ||
      q === 'trailer' ||
      q === 'teaser' ||
      q.includes('預告') ||
      q.includes('看預告')
    ) {
      if (mediaId) {
        try {
          const trailerKey = await getMediaTrailer(mediaType, mediaId);
          if (trailerKey) {
            const videos: AiMediaVideo[] = [
              {
                key: trailerKey,
                name: `${title} Trailer`,
                site: 'YouTube',
                type: 'Trailer',
              },
            ];

            const text = isZh
              ? `🎬 **為您載入《${title}》官方預告片：**\n\n點擊下方預告片卡片即可直接在對話視窗內播放觀賞。`
              : `🎬 **Official Trailer for *${title}*:**\n\nClick the trailer player below to stream the video directly inside chat.`;

            return {
              text,
              videos,
              provider: 'direct-api',
              tier: 1,
            };
          }
        } catch (e) {
          console.warn('Failed trailer lookup:', e);
        }
      }
    }

    return null;
  }
}
