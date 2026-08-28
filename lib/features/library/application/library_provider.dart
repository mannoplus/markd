import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:markd/features/home/data/models/media_model.dart';
import 'package:markd/features/home/data/repositories/media_repository.dart';

/// A saved item's status within the user's library.
enum LibraryStatus { watchlist, watched, favorite }

/// Immutable library state: media ids grouped by status.
class LibraryState {
  const LibraryState({
    this.watchlist = const <int, Media>{},
    this.watched = const <int, Media>{},
    this.favorites = const <int, Media>{},
  });

  final Map<int, Media> watchlist;
  final Map<int, Media> watched;
  final Map<int, Media> favorites;

  /// Items shown under the given [status] tab, most-recently-added first.
  List<Media> items(LibraryStatus status) {
    final map = switch (status) {
      LibraryStatus.watchlist => watchlist,
      LibraryStatus.watched => watched,
      LibraryStatus.favorite => favorites,
    };
    return map.values.toList().reversed.toList();
  }

  LibraryStatus? statusOf(int mediaId) {
    if (watchlist.containsKey(mediaId)) return LibraryStatus.watchlist;
    if (watched.containsKey(mediaId)) return LibraryStatus.watched;
    if (favorites.containsKey(mediaId)) return LibraryStatus.favorite;
    return null;
  }

  LibraryState copyWith({
    Map<int, Media>? watchlist,
    Map<int, Media>? watched,
    Map<int, Media>? favorites,
  }) {
    return LibraryState(
      watchlist: watchlist ?? this.watchlist,
      watched: watched ?? this.watched,
      favorites: favorites ?? this.favorites,
    );
  }
}

/// Manages the user's saved titles. Seeded from the repository's starter
/// watchlist; add/remove operations update the maps immutably.
class LibraryController extends AsyncNotifier<LibraryState> {
  @override
  Future<LibraryState> build() async {
    final repo = ref.watch(mediaRepositoryProvider);
    final seed = await repo.getWatchlist();
    final state = const LibraryState();
    return state.copyWith(
      watchlist: {for (final m in seed) m.id: m},
    );
  }

  void toggle(LibraryStatus status, Media media) {
    final current = state.valueOrNull;
    if (current == null) return;
    final map = switch (status) {
      LibraryStatus.watchlist => Map<int, Media>.of(current.watchlist),
      LibraryStatus.watched => Map<int, Media>.of(current.watched),
      LibraryStatus.favorite => Map<int, Media>.of(current.favorites),
    };
    if (map.containsKey(media.id)) {
      map.remove(media.id);
    } else {
      map[media.id] = media;
    }
    state = AsyncData(_updated(current, status, map));
  }

  /// Remove from every list (context-menu "Remove").
  void removeFromAll(Media media) {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData(current.copyWith(
      watchlist: Map<int, Media>.of(current.watchlist)..remove(media.id),
      watched: Map<int, Media>.of(current.watched)..remove(media.id),
      favorites: Map<int, Media>.of(current.favorites)..remove(media.id),
    ));
  }

  LibraryState _updated(
    LibraryState current,
    LibraryStatus status,
    Map<int, Media> map,
  ) {
    return switch (status) {
      LibraryStatus.watchlist => current.copyWith(watchlist: map),
      LibraryStatus.watched => current.copyWith(watched: map),
      LibraryStatus.favorite => current.copyWith(favorites: map),
    };
  }
}

final libraryProvider =
    AsyncNotifierProvider<LibraryController, LibraryState>(
  LibraryController.new,
);
