import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:markd/core/theme/app_colors.dart';
import 'package:markd/features/home/data/models/media_model.dart';
import 'package:markd/features/home/data/repositories/media_repository.dart';
import 'package:markd/shared/widgets/media_rail.dart';

/// Media detail screen: backdrop header, title metadata (year / rating /
/// runtime / genres), synopsis, and primary actions. It resolves the item via
/// [mediaByIdProvider] keyed on the `/details/:id` route parameter.
class MediaDetailsPage extends ConsumerWidget {
  const MediaDetailsPage({super.key, required this.mediaId});

  final int mediaId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(mediaByIdProvider(mediaId));
    final related = ref.watch(topRatedProvider);

    return Scaffold(
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorState(
          message: 'Something went wrong.',
          onRetry: () => ref.invalidate(mediaByIdProvider(mediaId)),
        ),
        data: (media) {
          if (media == null) {
            return _ErrorState(
              message: 'Title not found.',
              onRetry: () => context.pop(),
            );
          }
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                expandedHeight: 300,
                backgroundColor: AppColors.background,
                leading: const _BackButton(),
                flexibleSpace: FlexibleSpaceBar(
                  background: _BackdropHeader(media: media),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        media.title,
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.5,
                            ),
                      ),
                      if (media.tagline != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          media.tagline!,
                          style: Theme.of(context)
                              .textTheme
                              .bodyLarge
                              ?.copyWith(color: AppColors.foregroundMuted),
                        ),
                      ],
                      const SizedBox(height: 12),
                      _MetaPills(media: media),
                      const SizedBox(height: 16),
                      const _ActionRow(),
                      if (media.overview?.isNotEmpty == true) ...[
                        const SizedBox(height: 20),
                        Text(
                          'Overview',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          media.overview!,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(height: 1.55),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(top: 32, bottom: 8),
                  child: MediaRail(
                    eyebrow: 'MORE LIKE THIS',
                    title: 'Related Titles',
                    async: related,
                    onOpen: (m) {
                      if (m.id == media.id) return;
                      context.pushReplacement('/details/${m.id}');
                    },
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          );
        },
      ),
    );
  }
}

class _BackButton extends StatelessWidget {
  const _BackButton();

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => context.canPop() ? context.pop() : context.go('/'),
      icon: const Icon(Icons.arrow_back_rounded, color: AppColors.foreground),
      style: IconButton.styleFrom(
        backgroundColor: Colors.black.withValues(alpha: 0.45),
      ),
    );
  }
}

class _MetaPills extends StatelessWidget {
  const _MetaPills({required this.media});

  final Media media;

  @override
  Widget build(BuildContext context) {
    final parts = <String>[
      if (media.releaseYear != null) '${media.releaseYear}',
      if (media.runtimeMinutes != null) '${media.runtimeMinutes} min',
      '${media.voteAverage?.toStringAsFixed(1) ?? '—'} ★',
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        for (final p in parts) _Pill(text: p, icon: null),
        for (final g in media.genres) _Pill(text: g, icon: null),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text, this.icon});

  final String text;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: AppColors.foregroundSecondary),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.foregroundSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  const _ActionRow();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 8,
      children: const [
        _PillAction(label: 'Play', icon: Icons.play_arrow_rounded, filled: true),
        _PillAction(
            label: 'Add to List', icon: Icons.bookmark_add_outlined, filled: false),
        _PillAction(
            label: 'Mark Watched', icon: Icons.visibility_outlined, filled: false),
      ],
    );
  }
}

class _PillAction extends StatelessWidget {
  const _PillAction({
    required this.label,
    required this.icon,
    required this.filled,
  });

  final String label;
  final IconData icon;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
      decoration: BoxDecoration(
        color: filled ? AppColors.accent : Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(999),
        border: filled
            ? null
            : Border.all(color: Colors.white.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon,
              size: 16, color: filled ? Colors.black : AppColors.foreground),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: filled ? Colors.black : AppColors.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline,
              size: 48, color: AppColors.foregroundMuted),
          const SizedBox(height: 12),
          Text(message, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

class _BackdropHeader extends StatelessWidget {
  const _BackdropHeader({required this.media});

  final Media media;

  @override
  Widget build(BuildContext context) {
    final backdrop = media.backdropUrl(780) ?? media.posterUrl(342);
    return Stack(
      fit: StackFit.expand,
      children: [
        if (backdrop != null)
          CachedNetworkImage(
            imageUrl: backdrop,
            fit: BoxFit.cover,
            errorWidget: (_, _, _) => const _HeaderPlaceholder(),
          )
        else
          const _HeaderPlaceholder(),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.transparent, Color(0xCC0a0c11), AppColors.background],
              stops: [0.3, 0.7, 1.0],
            ),
          ),
        ),
      ],
    );
  }
}

class _HeaderPlaceholder extends StatelessWidget {
  const _HeaderPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.backgroundCard,
      alignment: Alignment.center,
      child: const Icon(
        Icons.movie_creation_outlined,
        size: 64,
        color: AppColors.foregroundMuted,
      ),
    );
  }
}