import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:markd/core/theme/app_colors.dart';
import 'package:markd/features/home/data/models/media_model.dart';
import 'package:markd/features/library/application/library_provider.dart';

/// Full-bleed cinematic hero carousel with backdrop slides, a metadata pill
/// rail, primary playback + watchlist actions, auto-advance, and tappable
/// pagination dots. Mirrors the web `HeroCarousel`.
class HeroCarousel extends ConsumerStatefulWidget {
  const HeroCarousel({
    super.key,
    required this.items,
    required this.onOpen,
  });

  final List<Media> items;
  final ValueChanged<Media> onOpen;

  @override
  ConsumerState<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends ConsumerState<HeroCarousel> {
  static const _autoAdvance = Duration(seconds: 7);

  late final PageController _controller;
  Timer? _timer;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _controller = PageController();
    _startAutoAdvance();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _startAutoAdvance() {
    _timer?.cancel();
    if (widget.items.length < 2) return;
    _timer = Timer.periodic(_autoAdvance, (_) {
      if (!mounted || !_controller.hasClients) return;
      final next = (_index + 1) % widget.items.length;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 650),
        curve: Curves.easeInOut,
      );
    });
  }

  void _goTo(int index) {
    _timer?.cancel();
    _controller.animateToPage(
      index,
      duration: const Duration(milliseconds: 450),
      curve: Curves.easeInOutCubic,
    );
    _startAutoAdvance();
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.items;
    if (items.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 470,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: items.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, i) => _HeroSlide(
              media: items[i],
              onOpen: () => widget.onOpen(items[i]),
            ),
          ),
          if (items.length > 1) ..._buildArrows(),
          Positioned(
            left: 0,
            right: 0,
            bottom: 12,
            child: _Pagination(
              count: items.length,
              active: _index,
              onSelect: _goTo,
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildArrows() {
    IconButton arrow({required IconData icon, required VoidCallback onTap}) {
      return IconButton(
        onPressed: onTap,
        icon: Icon(icon, color: AppColors.foreground),
        style: IconButton.styleFrom(
          backgroundColor: Colors.black.withValues(alpha: 0.45),
        ),
      );
    }

    return [
      Positioned(
        left: 8,
        top: 0,
        bottom: 0,
        child: Center(
          child: arrow(
            icon: Icons.chevron_left,
            onTap: () => _goTo((_index - 1 + widget.items.length) % widget.items.length),
          ),
        ),
      ),
      Positioned(
        right: 8,
        top: 0,
        bottom: 0,
        child: Center(
          child: arrow(
            icon: Icons.chevron_right,
            onTap: () => _goTo((_index + 1) % widget.items.length),
          ),
        ),
      ),
    ];
  }
}

class _HeroSlide extends StatelessWidget {
  const _HeroSlide({required this.media, required this.onOpen});

  final Media media;
  final VoidCallback onOpen;

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
            errorWidget: (_, _, _) => const _HeroBackdropPlaceholder(),
          )
        else
          const _HeroBackdropPlaceholder(),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AppColors.background, Color(0xCC0a0c11), AppColors.background],
              stops: [0.0, 0.25, 1.0],
            ),
          ),
        ),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [AppColors.background, Color(0x000a0c11)],
              stops: [0.0, 0.55],
            ),
          ),
        ),
        Positioned(
          left: 20,
          right: 20,
          bottom: 56,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'FEATURED',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2.0,
                  color: AppColors.foregroundMuted,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                media.title,
                style: const TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w800,
                  height: 1.05,
                  letterSpacing: -0.5,
                  color: AppColors.foreground,
                ),
              ),
              const SizedBox(height: 10),
              _MetaPills(media: media),
              const SizedBox(height: 10),
              Text(
                media.overview ?? '',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.foregroundSecondary,
                    ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 8,
                children: [
                  const _ActionButton(
                    label: 'Watch Trailer',
                    icon: Icons.play_arrow_rounded,
                    filled: true,
                  ),
                  _WatchlistButton(media: media),
                  _ActionButton(
                    label: 'Details',
                    icon: Icons.info_outline_rounded,
                    filled: false,
                    onTap: onOpen,
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Hero watchlist toggle wired to the shared [libraryProvider].
class _WatchlistButton extends ConsumerWidget {
  const _WatchlistButton({required this.media});

  final Media media;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inList = ref
            .watch(libraryProvider)
            .valueOrNull
            ?.statusOf(media.id) ==
        LibraryStatus.watchlist;
    return _ActionButton(
      label: inList ? '✓ In Watchlist' : '+ Add to Watchlist',
      icon: inList ? Icons.check_rounded : Icons.bookmark_add_outlined,
      filled: false,
      onTap: () => ref
          .read(libraryProvider.notifier)
          .toggle(LibraryStatus.watchlist, media),
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
      if (media.voteAverage != null)
        '★ ${media.voteAverage!.toStringAsFixed(1)}',
      media.isTv ? 'TV Series' : 'Movie',
      if (media.genres.isNotEmpty) media.genres.take(2).join(' · '),
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 6,
      children: [
        for (final p in parts)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
            ),
            child: Text(
              p,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.foregroundSecondary,
              ),
            ),
          ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.filled,
    this.onTap,
  });

  final String label;
  final IconData icon;
  final bool filled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? AppColors.accent : Colors.white.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: filled
                ? null
                : Border.all(color: Colors.white.withValues(alpha: 0.18)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 18,
                color: filled ? Colors.black : AppColors.foreground,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                  color: filled ? Colors.black : AppColors.foreground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Pagination extends StatelessWidget {
  const _Pagination({
    required this.count,
    required this.active,
    required this.onSelect,
  });

  final int count;
  final int active;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < count; i++)
          GestureDetector(
            onTap: () => onSelect(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: i == active ? 26 : 7,
              height: 7,
              decoration: BoxDecoration(
                color: i == active
                    ? AppColors.accent
                    : AppColors.foreground.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
      ],
    );
  }
}

class _HeroBackdropPlaceholder extends StatelessWidget {
  const _HeroBackdropPlaceholder();

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