import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:markd/core/theme/app_colors.dart';
import 'package:markd/features/home/data/repositories/media_repository.dart';
import 'package:markd/shared/widgets/media_card.dart';

/// Library: the user's watchlist, rendered as an editorial poster grid.
class LibraryPage extends ConsumerWidget {
  const LibraryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(watchlistProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Library'),
        automaticallyImplyLeading: false,
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const _Empty(title: 'Could not load your library.'),
        data: (items) {
          if (items.isEmpty) {
            return const _Empty(title: 'Your watchlist is a blank screen.');
          }
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 12,
              childAspectRatio: 0.58,
            ),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final media = items[index];
              return MediaCard(
                width: double.infinity,
                media: media,
                heroTag: 'library-${media.id}',
                onTap: () => context.push('/details/${media.id}'),
              );
            },
          );
        },
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.bookmark_outline,
              size: 48, color: AppColors.foregroundMuted),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
