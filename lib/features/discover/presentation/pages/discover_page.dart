import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:markd/core/theme/app_colors.dart';
import 'package:markd/features/home/data/models/media_model.dart';
import 'package:markd/features/home/data/repositories/media_repository.dart';
import 'package:markd/shared/widgets/media_card.dart';

/// Discover: a lightweight title search across the (mock) catalog.
class DiscoverPage extends ConsumerStatefulWidget {
  const DiscoverPage({super.key});

  @override
  ConsumerState<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends ConsumerState<DiscoverPage> {
  final _controller = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(searchProvider(_query));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Discover'),
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _controller,
              onChanged: (v) => setState(() => _query = v.trim()),
              decoration: InputDecoration(
                hintText: 'Search movies & series…',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: _query.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.clear_rounded),
                        onPressed: () {
                          _controller.clear();
                          setState(() => _query = '');
                        },
                      ),
              ),
              textInputAction: TextInputAction.search,
            ),
          ),
          Expanded(
            child: _query.isEmpty
                ? _buildPrompt()
                : _buildResults(context, results),
          ),
        ],
      ),
    );
  }

  Widget _buildResults(
      BuildContext context, AsyncValue<List<Media>> results) {
    return results.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, _) => const Center(child: Text('Search failed.')),
      data: (items) {
        if (items.isEmpty) {
          return const Center(
            child: Text('No matches found.',
                style: TextStyle(color: AppColors.foregroundMuted)),
          );
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
              heroTag: 'discover-${media.id}',
              onTap: () => context.push('/details/${media.id}'),
            );
          },
        );
      },
    );
  }

  Widget _buildPrompt() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.explore_outlined,
                size: 48, color: AppColors.foregroundMuted),
            SizedBox(height: 12),
            Text(
              'Find something new to watch.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.foregroundMuted),
            ),
          ],
        ),
      ),
    );
  }
}
