import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:markd/core/theme/app_colors.dart';
import 'package:markd/features/home/data/models/media_model.dart';

/// A poster-styled media card (2:3) mirroring the web `MovieCard`:
/// hairline border, 2:3 artwork, top-left type chip, top-right rating badge,
/// and a title + meta row below. Tapping calls [onTap] (e.g. open details).
class MediaCard extends StatelessWidget {
  const MediaCard({
    super.key,
    required this.media,
    this.width,
    this.onTap,
    this.heroTag,
  });

  final Media media;
  final double? width;
  final VoidCallback? onTap;
  final Object? heroTag;

  @override
  Widget build(BuildContext context) {
    final w = width ?? 130.0;
    return SizedBox(
      width: w,
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Poster(media: media, heroTag: heroTag),
            const SizedBox(height: 8),
            Text(
              media.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontSize: 13,
                    height: 1.25,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 2),
            Text(
              _metaLabel,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  String get _metaLabel {
    final parts = <String>[
      if (media.releaseYear != null) '${media.releaseYear}',
      if (media.voteAverage != null)
        '★ ${media.voteAverage!.toStringAsFixed(1)}',
    ];
    return parts.join(' · ');
  }
}

class _Poster extends StatelessWidget {
  const _Poster({required this.media, this.heroTag});

  final Media media;
  final Object? heroTag;

  @override
  Widget build(BuildContext context) {
    final poster = media.posterUrl(342);
    final placeholder = const _PosterPlaceholder();
    final artwork = ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: AspectRatio(
        aspectRatio: 2 / 3,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (poster != null)
              CachedNetworkImage(
                imageUrl: poster,
                fit: BoxFit.cover,
                placeholder: (_, _) => placeholder,
                errorWidget: (_, _, _) => placeholder,
              )
            else
              placeholder,
            Positioned(left: 6, top: 6, child: _TypeChip(isTv: media.isTv)),
            if (media.voteAverage != null)
              Positioned(
                right: 6,
                top: 6,
                child: _RatingBadge(score: media.voteAverage!),
              ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black54],
                  stops: [0.55, 1.0],
                ),
              ),
            ),
          ],
        ),
      ),
    );

    if (heroTag == null) return artwork;
    return Hero(tag: heroTag!, child: artwork);
  }
}

class _TypeChip extends StatelessWidget {
  const _TypeChip({required this.isTv});

  final bool isTv;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isTv ? Icons.live_tv_outlined : Icons.movie_outlined,
            size: 10,
            color: AppColors.foregroundSecondary,
          ),
          const SizedBox(width: 3),
          Text(
            isTv ? 'TV' : 'Film',
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppColors.foregroundSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _RatingBadge extends StatelessWidget {
  const _RatingBadge({required this.score});

  final double score;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star_rounded, size: 11, color: AppColors.goldStar),
          const SizedBox(width: 2),
          Text(
            score.toStringAsFixed(1),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: AppColors.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

class _PosterPlaceholder extends StatelessWidget {
  const _PosterPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.backgroundCard,
      alignment: Alignment.center,
      child: const Icon(
        Icons.local_movies_outlined,
        size: 40,
        color: AppColors.foregroundMuted,
      ),
    );
  }
}