import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:markd/core/theme/app_colors.dart';
import 'package:markd/features/home/data/models/media_model.dart';
import 'package:markd/features/home/data/repositories/media_repository.dart';
import 'package:markd/shared/widgets/hero_carousel.dart';
import 'package:markd/shared/widgets/media_rail.dart';

/// Home: full-bleed hero carousel followed by personalized and editorial
/// media rails, mirroring the web homepage.
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featured = ref.watch(featuredProvider);
    final forYou = ref.watch(forYouProvider);
    final freeToWatch = ref.watch(freeToWatchProvider);
    final trending = ref.watch(trendingProvider);
    final topRated = ref.watch(topRatedProvider);

    void open(Media media) => context.push('/details/${media.id}');

    final heroItems = featured.value ?? const <Media>[];

    return RefreshIndicator(
      color: AppColors.accent,
      backgroundColor: AppColors.backgroundElevated,
      onRefresh: () async {
        ref.invalidate(featuredProvider);
        ref.invalidate(forYouProvider);
        ref.invalidate(freeToWatchProvider);
        ref.invalidate(trendingProvider);
        ref.invalidate(topRatedProvider);
        await Future<void>.delayed(const Duration(milliseconds: 600));
      },
      child: ListView(
        padding: EdgeInsets.zero,
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const _TopBar(),
          if (heroItems.isNotEmpty)
            HeroCarousel(items: heroItems, onOpen: open),
          const SizedBox(height: 28),
          MediaRail(
            eyebrow: 'FOR YOU',
            title: "Tonight's Picks for You",
            subtitle: 'Hand-picked from your taste profile.',
            async: forYou,
            onOpen: open,
          ),
          const SizedBox(height: 32),
          MediaRail(
            eyebrow: 'FREE TO WATCH',
            title: 'Popular Movies',
            async: freeToWatch,
            onOpen: open,
          ),
          const SizedBox(height: 32),
          MediaRail(
            eyebrow: 'TRENDING',
            title: 'Trending Now',
            async: trending,
            onOpen: open,
          ),
          const SizedBox(height: 32),
          MediaRail(
            eyebrow: 'TOP RATED',
            title: 'Top Rated Series',
            async: topRated,
            onOpen: open,
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
        child: Row(
          children: [
            Container(
              width: 26,
              height: 26,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(7),
              ),
              child: const Text(
                'M',
                style: TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'MARKD',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                letterSpacing: 2.0,
                color: AppColors.foreground,
              ),
            ),
            const Spacer(),
            Icon(Icons.search_rounded, color: AppColors.foregroundSecondary),
          ],
        ),
      ),
    );
  }
}
