import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:markd/core/theme/app_colors.dart';
import 'package:markd/features/home/data/models/media_model.dart';
import 'package:markd/features/home/data/repositories/media_repository.dart';
import 'package:markd/shared/widgets/media_card.dart';

/// Discover: debounced search, Movies/TV toggle, sort dropdown, an advanced
/// filter sheet (genres, year range, minimum rating) and an infinite-scroll
/// poster grid.
class DiscoverPage extends ConsumerStatefulWidget {
  const DiscoverPage({super.key});

  @override
  ConsumerState<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends ConsumerState<DiscoverPage> {
  static const _pageSize = 12;

  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  Timer? _debounce;

  String _query = '';
  String _mediaType = 'movie';
  DiscoverSort _sort = DiscoverSort.popular;
  Set<String> _genres = {};
  int? _minYear;
  int? _maxYear;
  double? _minRating;

  List<Media> _items = [];
  int _page = 1;
  bool _loadingMore = false;
  bool _reachedEnd = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 400) {
      _loadMore();
    }
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      if (!mounted) return;
      setState(() => _query = value.trim());
      _reset();
    });
  }

  void _reset() {
    setState(() {
      _items = [];
      _page = 1;
      _reachedEnd = false;
      _loadingMore = false;
    });
  }

  void _applySort(DiscoverSort sort) {
    setState(() => _sort = sort);
    _reset();
  }

  void _applyMediaType(String type) {
    if (type == _mediaType) return;
    setState(() => _mediaType = type);
    _reset();
  }

  void _applyFilters({
    required Set<String> genres,
    int? minYear,
    int? maxYear,
    double? minRating,
  }) {
    setState(() {
      _genres = genres;
      _minYear = minYear;
      _maxYear = maxYear;
      _minRating = minRating;
    });
    _reset();
  }

  DiscoverQuery get _baseQuery => DiscoverQuery(
        mediaType: _mediaType,
        query: _query,
        sort: _sort,
        genres: _genres,
        minYear: _minYear,
        maxYear: _maxYear,
        minRating: _minRating,
        page: _page,
        pageSize: _pageSize,
      );

  Future<void> _loadMore() async {
    if (_loadingMore || _reachedEnd) return;
    _loadingMore = true;
    final next = _baseQuery.copyWith(page: _page + 1);
    try {
      final more =
          await ref.read(mediaRepositoryProvider).discover(query: next);
      if (!mounted) return;
      setState(() {
        if (more.isEmpty) {
          _reachedEnd = true;
        } else {
          _items = [..._items, ...more];
          _page++;
        }
      });
    } finally {
      _loadingMore = false;
    }
  }

  int get _activeFilterCount =>
      _genres.length +
      (_minYear != null || _maxYear != null ? 1 : 0) +
      (_minRating != null ? 1 : 0);


  @override
  Widget build(BuildContext context) {
    final results = ref.watch(discoverProvider(_baseQuery));
    final isLoading = results.isLoading && _items.isEmpty;
    final items = _items.isNotEmpty ? _items : (results.value ?? const []);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Discover'),
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: TextField(
              controller: _controller,
              onChanged: _onQueryChanged,
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
                          _reset();
                        },
                      ),
              ),
              textInputAction: TextInputAction.search,
            ),
          ),
          _ControlBar(
            mediaType: _mediaType,
            sort: _sort,
            activeFilters: _activeFilterCount,
            onMediaType: _applyMediaType,
            onSort: _applySort,
            onOpenFilters: () => _showFilterSheet(context),
          ),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : items.isEmpty
                    ? _EmptyResults(onClear: () {
                        _controller.clear();
                        setState(() {
                          _query = '';
                          _genres = {};
                          _minYear = null;
                          _maxYear = null;
                          _minRating = null;
                        });
                        _reset();
                      })
                    : _buildGrid(items, results),
          ),
        ],
      ),
    );
  }

  Widget _buildGrid(List<Media> items, AsyncValue<List<Media>> results) {
    if (results.hasError && _items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded,
                size: 44, color: AppColors.foregroundMuted),
            const SizedBox(height: 12),
            const Text('Could not load titles.'),
            const SizedBox(height: 8),
            TextButton(onPressed: _reset, child: const Text('Retry')),
          ],
        ),
      );
    }
    return GridView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 12,
        childAspectRatio: 0.58,
      ),
      itemCount: items.length + (_reachedEnd ? 0 : 2),
      itemBuilder: (context, index) {
        if (index >= items.length) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          );
        }
        final media = items[index];
        return MediaCard(
          width: double.infinity,
          media: media,
          heroTag: 'discover-${media.id}',
          onTap: () => context.push('/details/${media.id}'),
        );
      },
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.backgroundElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => FilterSheet(
        allGenres: ref.read(genresProvider).value ?? const [],
        initialGenres: _genres,
        initialMinYear: _minYear,
        initialMaxYear: _maxYear,
        initialMinRating: _minRating,
        onApply: _applyFilters,
      ),
    );
  }
}

class _ControlBar extends StatelessWidget {
  const _ControlBar({
    required this.mediaType,
    required this.sort,
    required this.activeFilters,
    required this.onMediaType,
    required this.onSort,
    required this.onOpenFilters,
  });

  final String mediaType;
  final DiscoverSort sort;
  final int activeFilters;
  final ValueChanged<String> onMediaType;
  final ValueChanged<DiscoverSort> onSort;
  final VoidCallback onOpenFilters;

  static const _sortLabels = {
    DiscoverSort.popular: 'Popular',
    DiscoverSort.topRated: 'Top Rated',
    DiscoverSort.releaseDate: 'Release Date',
    DiscoverSort.score: 'Score',
  };

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: AppColors.backgroundCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  for (final entry in const {
                    'movie': 'Movies',
                    'tv': 'TV Shows',
                  }.entries)
                    Expanded(
                      child: GestureDetector(
                        onTap: () => onMediaType(entry.key),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(vertical: 7),
                          decoration: BoxDecoration(
                            color: mediaType == entry.key
                                ? AppColors.accent
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            entry.value,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: mediaType == entry.key
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
          const SizedBox(width: 8),
          PopupMenuButton<DiscoverSort>(
            initialValue: sort,
            onSelected: onSort,
            color: AppColors.backgroundElevated,
            itemBuilder: (_) => [
              for (final e in _sortLabels.entries)
                PopupMenuItem(
                  value: e.key,
                  height: 40,
                  child: Text(e.value, style: const TextStyle(fontSize: 13)),
                ),
            ],
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
              decoration: BoxDecoration(
                color: AppColors.backgroundCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _sortLabels[sort]!,
                    style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.keyboard_arrow_down_rounded,
                      size: 16, color: AppColors.foregroundMuted),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onOpenFilters,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
              decoration: BoxDecoration(
                color: activeFilters > 0
                    ? AppColors.accentMuted
                    : AppColors.backgroundCard,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.tune_rounded,
                      size: 16, color: AppColors.foreground),
                  if (activeFilters > 0) ...[
                    const SizedBox(width: 4),
                    Text(
                      '$activeFilters',
                      style: const TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults({required this.onClear});

  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.explore_outlined,
                size: 48, color: AppColors.foregroundMuted),
            const SizedBox(height: 12),
            const Text(
              'No titles match. Try a different search or loosen your filters.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.foregroundMuted),
            ),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onClear, child: const Text('Reset')),
          ],
        ),
      ),
    );
  }
}

/// Bottom-sheet filter modal: genre chips, year range slider, rating slider.
class FilterSheet extends StatefulWidget {
  const FilterSheet({
    super.key,
    required this.allGenres,
    required this.initialGenres,
    required this.initialMinYear,
    required this.initialMaxYear,
    required this.initialMinRating,
    required this.onApply,
  });

  final List<String> allGenres;
  final Set<String> initialGenres;
  final int? initialMinYear;
  final int? initialMaxYear;
  final double? initialMinRating;
  final void Function({
    required Set<String> genres,
    int? minYear,
    int? maxYear,
    double? minRating,
  }) onApply;

  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  static const double _yearMin = 1990;
  static const double _yearMax = 2026;

  late Set<String> _genres = Set.of(widget.initialGenres);
  late RangeValues _years = RangeValues(
    (widget.initialMinYear ?? _yearMin).toDouble(),
    (widget.initialMaxYear ?? _yearMax).toDouble(),
  );
  late double _minRating = widget.initialMinRating ?? 0;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Filters & Sorting',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => setState(() {
                    _genres = {};
                    _years = const RangeValues(_yearMin, _yearMax);
                    _minRating = 0;
                  }),
                  child: const Text('Clear all'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Flexible(
              child: SingleChildScrollView(
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final g in widget.allGenres)
                      FilterChip(
                        label: Text(g),
                        selected: _genres.contains(g),
                        showCheckmark: false,
                        onSelected: (on) => setState(() {
                          on ? _genres.add(g) : _genres.remove(g);
                        }),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Release year: ${_years.start.round()} – ${_years.end.round()}',
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.foregroundMuted),
            ),
            RangeSlider(
              values: _years,
              min: _yearMin,
              max: _yearMax,
              divisions: (_yearMax - _yearMin).round(),
              labels: RangeLabels(
                _years.start.round().toString(),
                _years.end.round().toString(),
              ),
              onChanged: (v) => setState(() => _years = v),
            ),
            Text(
              _minRating <= 0
                  ? 'Any rating'
                  : 'Minimum rating: ★ ${_minRating.toStringAsFixed(1)}',
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.foregroundMuted),
            ),
            Slider(
              value: _minRating,
              min: 0,
              max: 10,
              divisions: 20,
              label: _minRating.toStringAsFixed(1),
              onChanged: (v) => setState(() => _minRating = v),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  widget.onApply(
                    genres: _genres,
                    minYear: _years.start.round() > _yearMin
                        ? _years.start.round()
                        : null,
                    maxYear: _years.end.round() < _yearMax
                        ? _years.end.round()
                        : null,
                    minRating: _minRating > 0 ? _minRating : null,
                  );
                  Navigator.of(context).pop();
                },
                child: const Text('Apply Filters',
                    style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

