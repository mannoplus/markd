import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:markd/features/home/data/models/media_model.dart';

/// Contract for media data access.
abstract class MediaRepository {
  /// Hero carousel titles (featured for home).
  Future<List<Media>> getFeatured();

  /// Trending rail.
  Future<List<Media>> getTrending();

  /// Personalized recommendation shelf, e.g. "Because you loved X".
  Future<List<Media>> getForYou();

  /// Free to watch rail.
  Future<List<Media>> getFreeToWatch();

  /// Top rated rail.
  Future<List<Media>> getTopRated();

  /// The user's watchlist / library.
  Future<List<Media>> getWatchlist();

  /// Look up a single item by id (media details).
  Future<Media?> getById(int id);

  /// Simple title-based search.
  Future<List<Media>> search(String query);

  /// Filtered, sorted, paginated discovery results.
  Future<List<Media>> discover({required DiscoverQuery query});

  /// Genre options available for filtering.
  Future<List<String>> getGenres();
}

/// How discover results are ordered.
enum DiscoverSort { popular, topRated, releaseDate, score }

/// Parameters for a discover page fetch.
class DiscoverQuery {
  const DiscoverQuery({
    this.mediaType = 'movie',
    this.query = '',
    this.sort = DiscoverSort.popular,
    this.genres = const <String>{},
    this.minYear,
    this.maxYear,
    this.minRating,
    this.page = 1,
    this.pageSize = 12,
  });

  final String mediaType; // 'movie' | 'tv'
  final String query;
  final DiscoverSort sort;
  final Set<String> genres;
  final int? minYear;
  final int? maxYear;
  final double? minRating;
  final int page;
  final int pageSize;

  DiscoverQuery copyWith({
    String? mediaType,
    String? query,
    DiscoverSort? sort,
    Set<String>? genres,
    int? minYear,
    int? maxYear,
    double? minRating,
    int? page,
  }) {
    return DiscoverQuery(
      mediaType: mediaType ?? this.mediaType,
      query: query ?? this.query,
      sort: sort ?? this.sort,
      genres: genres ?? this.genres,
      minYear: minYear ?? this.minYear,
      maxYear: maxYear ?? this.maxYear,
      minRating: minRating ?? this.minRating,
      page: page ?? this.page,
      pageSize: pageSize,
    );
  }
}

/// Fully-typed mock implementation preloaded with a sample MARKD catalog so the
/// app runs out-of-the-box before a live API is connected.
class MockMediaRepository implements MediaRepository {
  const MockMediaRepository();

  static const Duration _delay = Duration(milliseconds: 320);

  static const List<Media> _catalog = [
    Media(
      id: 1,
      title: 'Interstellar',
      tagline: 'Mankind was born on Earth. It was never meant to die here.',
      overview:
          'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      backdropPath: '/tuZhZ6bgIOwjewO7I6pEV8cXiw.jpg',
      voteAverage: 8.4,
      mediaType: 'movie',
      releaseYear: 2014,
      genres: ['Sci-Fi', 'Drama', 'Adventure'],
      runtimeMinutes: 169,
    ),
    Media(
      id: 2,
      title: 'Blade Runner 2049',
      tagline: 'The key to the future is finally unearthed.',
      overview:
          'A young blade runner\'s discovery of a long-buried secret leads him to track down former blade runner Rick Deckard.',
      posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
      backdropPath: '/f46C3pZhQ9K9T8VQNJPx9K5PavF.jpg',
      voteAverage: 8.0,
      mediaType: 'movie',
      releaseYear: 2017,
      genres: ['Sci-Fi', 'Drama', 'Mystery'],
      runtimeMinutes: 163,
    ),
    Media(
      id: 3,
      title: 'The Prestige',
      tagline: 'Are you watching closely?',
      overview:
          'Two rival magicians engage in a bitter feud as they fight to be the world\'s greatest illusionist.',
      posterPath: '/5M0j0B18abtBI5gi2RhfjjurTqb.jpg',
      backdropPath: '/vDNyTAUHPXivVMLLa3mdmDfF01m.jpg',
      voteAverage: 8.2,
      mediaType: 'movie',
      releaseYear: 2006,
      genres: ['Mystery', 'Drama', 'Sci-Fi'],
      runtimeMinutes: 130,
    ),
    Media(
      id: 4,
      title: 'The Dark Knight',
      tagline: 'Why so serious?',
      overview:
          'Batman raises the stakes in his war on crime as the Joker plunges Gotham into anarchy.',
      posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      backdropPath: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
      voteAverage: 8.5,
      mediaType: 'movie',
      releaseYear: 2008,
      genres: ['Action', 'Crime', 'Drama'],
      runtimeMinutes: 152,
    ),
    Media(
      id: 5,
      title: 'Inception',
      tagline: 'Your mind is the scene of the crime.',
      overview:
          'A thief who steals corporate secrets through dream-sharing technology is given an inverse task.',
      posterPath: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      backdropPath: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
      voteAverage: 8.4,
      mediaType: 'movie',
      releaseYear: 2010,
      genres: ['Sci-Fi', 'Action', 'Thriller'],
      runtimeMinutes: 148,
    ),
    Media(
      id: 6,
      title: 'The Batman',
      tagline: 'Unmask the truth.',
      overview:
          'Batman ventures into Gotham City\'s underworld when a sadistic killer leaves behind a trail of cryptic clues.',
      posterPath: '/gOUXfWl6E8PLuKc9nAolYqP2S9o.jpg',
      backdropPath: '/aULh8Ylm89mH1ngRwfKAcW1Uu6F.jpg',
      voteAverage: 7.7,
      mediaType: 'movie',
      releaseYear: 2022,
      genres: ['Action', 'Crime', 'Mystery'],
      runtimeMinutes: 176,
    ),
    Media(
      id: 7,
      title: 'Oppenheimer',
      tagline: 'The world forever changes.',
      overview:
          'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      backdropPath: '/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
      voteAverage: 8.1,
      mediaType: 'movie',
      releaseYear: 2023,
      genres: ['Drama', 'History'],
      runtimeMinutes: 180,
    ),
    Media(
      id: 8,
      title: 'Dune',
      tagline: 'Beyond fear, destiny awaits.',
      overview:
          "Paul Atreides leads nomadic tribes in a battle to control the desert planet Arrakis and its spice.",
      posterPath: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
      backdropPath: '/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg',
      voteAverage: 7.8,
      mediaType: 'movie',
      releaseYear: 2021,
      genres: ['Sci-Fi', 'Adventure'],
      runtimeMinutes: 155,
    ),
    Media(
      id: 9,
      title: 'Arrival',
      tagline: 'Why are they here?',
      overview:
          "A linguist races to decipher an alien language to avert global conflict after mysterious craft touch down.",
      posterPath: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
      backdropPath: '/fFUnLw7t2B7Ed0wB2S8iLol6EFd.jpg',
      voteAverage: 7.9,
      mediaType: 'movie',
      releaseYear: 2016,
      genres: ['Sci-Fi', 'Drama', 'Mystery'],
      runtimeMinutes: 116,
    ),
    Media(
      id: 10,
      title: 'Whiplash',
      tagline: 'The road to greatness can take you to the edge.',
      overview:
          "A young drummer enrolls at a cut-throat conservatory where a ruthless instructor will stop at nothing.",
      posterPath: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
      backdropPath: '/suZBY9ay0R8B4bNl5DmXBB4cYdG.jpg',
      voteAverage: 8.5,
      mediaType: 'movie',
      releaseYear: 2014,
      genres: ['Drama', 'Music'],
      runtimeMinutes: 106,
    ),
    Media(
      id: 11,
      title: 'Spider-Man: Into the Spider-Verse',
      tagline: 'More than one wears the mask.',
      overview:
          "Teen Miles Morales becomes Spider-Man and must team up with spider-people from other dimensions.",
      posterPath: '/iiZZdoQBEYBv6id8su7ImL0Mow0.jpg',
      backdropPath: '/n7C3QU9FbGcq5VkfOEguGGDGygT.jpg',
      voteAverage: 8.4,
      mediaType: 'movie',
      releaseYear: 2018,
      genres: ['Animation', 'Action', 'Adventure'],
      runtimeMinutes: 117,
    ),
    Media(
      id: 12,
      title: 'Everything Everywhere All at Once',
      tagline: 'The universe is so much bigger than you realize.',
      overview:
          "An aging Chinese immigrant is swept up in an insane adventure where she alone can save existence.",
      posterPath: '/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
      backdropPath: '/st6dTdDFtuuSZW2R1vw6UAL2GNc.jpg',
      voteAverage: 7.9,
      mediaType: 'movie',
      releaseYear: 2022,
      genres: ['Sci-Fi', 'Action', 'Comedy'],
      runtimeMinutes: 139,
    ),
    Media(
      id: 13,
      title: 'Severance',
      tagline: "A split mind is a soldier's tool.",
      overview:
          "Mark leads a team of office workers whose memories have been surgically divided between work and personal lives.",
      posterPath: '/w7bz2GK8WqSfOJIBSj8UPbKBQdN.jpg',
      backdropPath: '/aDuNcf3m8ozY3hZSyjvTbYxDUEK.jpg',
      voteAverage: 8.4,
      mediaType: 'tv',
      releaseYear: 2022,
      genres: ['Drama', 'Mystery', 'Sci-Fi'],
      runtimeMinutes: null,
    ),
    Media(
      id: 14,
      title: 'The Last of Us',
      tagline: "When you're lost in the darkness, look for the light.",
      overview:
          "Twenty years after modern civilization has been destroyed, Joel is hired to smuggle Ellie out of a quarantine zone.",
      posterPath: '/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
      backdropPath: '/nn0aqSeqmDXLoBm1AmRRkWbqR9M.jpg',
      voteAverage: 8.7,
      mediaType: 'tv',
      releaseYear: 2023,
      genres: ['Drama', 'Action', 'Adventure'],
      runtimeMinutes: null,
    ),
  ];

  @override
  Future<List<Media>> getFeatured() async {
    await Future<void>.delayed(_delay);
    // Hero prefers titles with strong backdrops.
    return [_catalog[0], _catalog[3], _catalog[4], _catalog[5], _catalog[6]];
  }

  @override
  Future<List<Media>> getTrending() async {
    await Future<void>.delayed(_delay);
    return _catalog.toList();
  }

  @override
  Future<List<Media>> getForYou() async {
    await Future<void>.delayed(_delay);
    // "Because you loved The Batman" — moody, mystery-driven dramas.
    return [_catalog[5], _catalog[7], _catalog[3], _catalog[8], _catalog[1], _catalog[10]];
  }

  @override
  Future<List<Media>> getFreeToWatch() async {
    await Future<void>.delayed(_delay);
    return [_catalog[4], _catalog[9], _catalog[2], _catalog[10], _catalog[11]];
  }

  @override
  Future<List<Media>> getTopRated() async {
    await Future<void>.delayed(_delay);
    final sorted = _catalog.toList()
      ..sort((a, b) => (b.voteAverage ?? 0).compareTo(a.voteAverage ?? 0));
    return sorted.take(10).toList();
  }

  @override
  Future<List<Media>> getWatchlist() async {
    await Future<void>.delayed(_delay);
    return [_catalog[1], _catalog[6], _catalog[12], _catalog[8], _catalog[2]];
  }

  @override
  Future<Media?> getById(int id) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    for (final m in _catalog) {
      if (m.id == id) return m;
    }
    return null;
  }

  @override
  Future<List<Media>> search(String query) async {
    await Future<void>.delayed(_delay);
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return const [];
    return _catalog.where((m) => m.title.toLowerCase().contains(q)).toList();
  }

  @override
  Future<List<Media>> discover({required DiscoverQuery query}) async {
    await Future<void>.delayed(_delay);
    Iterable<Media> results = _catalog.where(
      (m) => m.mediaType == query.mediaType,
    );

    final q = query.query.trim().toLowerCase();
    if (q.isNotEmpty) {
      results = results.where((m) => m.title.toLowerCase().contains(q));
    }
    if (query.genres.isNotEmpty) {
      results = results.where(
        (m) => query.genres.any(m.genres.contains),
      );
    }
    if (query.minYear != null) {
      results = results.where(
        (m) => m.releaseYear != null && m.releaseYear! >= query.minYear!,
      );
    }
    if (query.maxYear != null) {
      results = results.where(
        (m) => m.releaseYear != null && m.releaseYear! <= query.maxYear!,
      );
    }
    if (query.minRating != null) {
      results = results.where(
        (m) => m.voteAverage != null && m.voteAverage! >= query.minRating!,
      );
    }

    final sorted = results.toList()..sort(_comparator(query.sort));

    // Simulate pagination over the filtered result set.
    final start = (query.page - 1) * query.pageSize;
    if (start >= sorted.length) return const [];
    return sorted.skip(start).take(query.pageSize).toList();
  }

  @override
  Future<List<String>> getGenres() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return _catalog.expand((m) => m.genres).toSet().toList()..sort();
  }

  static Comparator<Media> _comparator(DiscoverSort sort) {
    return switch (sort) {
      // Catalog order is curated by popularity.
      DiscoverSort.popular => (a, b) => b.popularity.compareTo(a.popularity),
      DiscoverSort.topRated => (a, b) =>
          (b.voteAverage ?? 0).compareTo(a.voteAverage ?? 0),
      DiscoverSort.releaseDate => (a, b) =>
          (b.releaseYear ?? 0).compareTo(a.releaseYear ?? 0),
      DiscoverSort.score => (a, b) =>
          (b.voteAverage ?? 0).compareTo(a.voteAverage ?? 0),
    };
  }
}

/// Provides the active [MediaRepository] implementation.
final mediaRepositoryProvider = Provider<MediaRepository>(
  (ref) => const MockMediaRepository(),
);

/// Hero carousel rail.
final featuredProvider = FutureProvider<List<Media>>(
  (ref) => ref.watch(mediaRepositoryProvider).getFeatured(),
);

/// Trending rail.
final trendingProvider = FutureProvider<List<Media>>(
  (ref) => ref.watch(mediaRepositoryProvider).getTrending(),
);

/// "Because you loved X" recommendation rail.
final forYouProvider = FutureProvider<List<Media>>(
  (ref) => ref.watch(mediaRepositoryProvider).getForYou(),
);

/// Free to watch rail.
final freeToWatchProvider = FutureProvider<List<Media>>(
  (ref) => ref.watch(mediaRepositoryProvider).getFreeToWatch(),
);

/// Top rated rail.
final topRatedProvider = FutureProvider<List<Media>>(
  (ref) => ref.watch(mediaRepositoryProvider).getTopRated(),
);

/// User watchlist / library.
final watchlistProvider = FutureProvider<List<Media>>(
  (ref) => ref.watch(mediaRepositoryProvider).getWatchlist(),
);

/// Resolve a single media item by id (for the detail screen).
final mediaByIdProvider = FutureProvider.family<Media?, int>(
  (ref, id) => ref.watch(mediaRepositoryProvider).getById(id),
);

/// Search provider keyed by query.
final searchProvider = FutureProvider.family<List<Media>, String>(
  (ref, query) => ref.watch(mediaRepositoryProvider).search(query),
);

/// Discover results keyed by query parameters.
final discoverProvider =
    FutureProvider.family<List<Media>, DiscoverQuery>(
  (ref, query) => ref.watch(mediaRepositoryProvider).discover(query: query),
);

/// Available genre filter options.
final genresProvider = FutureProvider<List<String>>(
  (ref) => ref.watch(mediaRepositoryProvider).getGenres(),
);
