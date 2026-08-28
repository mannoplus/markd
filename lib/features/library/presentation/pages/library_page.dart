import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:markd/core/theme/app_colors.dart';
import 'package:markd/features/home/data/models/media_model.dart';
import 'package:markd/features/library/application/library_provider.dart';
import 'package:markd/shared/widgets/media_card.dart';

/// Library: Watchlist / Watched / Favorites segmented tabs over a poster grid
/// with per-item quick actions via a bottom-sheet context menu.
class LibraryPage extends ConsumerStatefulWidget {
  const LibraryPage({super.key});

  @override
  ConsumerState<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends ConsumerState<LibraryPage> {
  LibraryStatus _tab = LibraryStatus.watchlist;

  static const _tabs = {
    LibraryStatus.watchlist: 'Watchlist',
    LibraryStatus.watched: 'Watched',
    LibraryStatus.favorite: 'Favorites',
  };

  void _showItemMenu(Media media) {
    final library = ref.read(libraryProvider).valueOrNull;
    final status = library?.statusOf(media.id);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.backgroundElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            _MenuTile(
              icon: Icons.visibility_outlined,
              label: 'Mark as Watched',
              onTap: () {
                Navigator.pop(sheetContext);
                ref
                    .read(libraryProvider.notifier)
                    .toggle(LibraryStatus.watched, media);
              },
            ),
            _MenuTile(
              icon: Icons.favorite_outline,
              label: status == LibraryStatus.favorite
                  ? 'Remove from Favorites'
                  : 'Add to Favorites',
              onTap: () {
                Navigator.pop(sheetContext);
                ref
                    .read(libraryProvider.notifier)
                    .toggle(LibraryStatus.favorite, media);
              },
            ),
            _MenuTile(
              icon: Icons.star_outline_rounded,
              label: 'Rate',
              onTap: () {
                Navigator.pop(sheetContext);
                ref
                    .read(libraryProvider.notifier)
                    .toggle(LibraryStatus.favorite, media);
              },
            ),
            _MenuTile(
              icon: Icons.delete_outline_rounded,
              label: 'Remove from Library',
              onTap: () {
                Navigator.pop(sheetContext);
                ref.read(libraryProvider.notifier).removeFromAll(media);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final libraryAsync = ref.watch(libraryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Library'),
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: AppColors.backgroundCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  for (final entry in _tabs.entries)
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _tab = entry.key),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(vertical: 9),
                          decoration: BoxDecoration(
                            color: _tab == entry.key
                                ? AppColors.accent
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: Text(
                            entry.value,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                              color: _tab == entry.key
                                  ? Colors.black
                                  : AppColors.foregroundSecondary,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          Expanded(
            child: libraryAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (_, _) => const _EmptyState(
                icon: Icons.wifi_off_rounded,
                title: 'Could not load your library.',
                subtitle: 'Check your connection and try again.',
              ),
              data: (library) {
                final items = library.items(_tab);
                if (items.isEmpty) {
                  return _EmptyState(
                    icon: switch (_tab) {
                      LibraryStatus.watchlist => Icons.bookmark_outline,
                      LibraryStatus.watched => Icons.visibility_outlined,
                      LibraryStatus.favorite => Icons.favorite_outline,
                    },
                    title: switch (_tab) {
                      LibraryStatus.watchlist => 'Your Watchlist is empty.',
                      LibraryStatus.watched => 'Nothing marked as watched yet.',
                      LibraryStatus.favorite => 'No favorites yet.',
                    },
                    subtitle: 'Explore Discover to add titles you want to '
                        'keep track of.',
                    ctaLabel: 'Browse Discover',
                    ctaRoute: '/discover',
                  );
                }
                return GridView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.58,
                  ),
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final media = items[index];
                    return GestureDetector(
                      onLongPress: () => _showItemMenu(media),
                      child: MediaCard(
                        width: double.infinity,
                        media: media,
                        heroTag: 'library-${_tab.name}-${media.id}',
                        onTap: () => context.push('/details/${media.id}'),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.foregroundSecondary),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      onTap: onTap,
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.title,
    required this.subtitle,
    required this.icon,
    this.ctaLabel,
    this.ctaRoute,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String? ctaLabel;
  final String? ctaRoute;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accentSubtle,
                border: Border.all(color: AppColors.border),
              ),
              child: Icon(icon, size: 30, color: AppColors.foregroundMuted),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.foreground,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.foregroundMuted,
              ),
            ),
            if (ctaLabel != null && ctaRoute != null) ...[
              const SizedBox(height: 18),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 22,
                    vertical: 12,
                  ),
                ),
                onPressed: () => context.go(ctaRoute!),
                child: Text(ctaLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
