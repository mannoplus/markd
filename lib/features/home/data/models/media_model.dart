import 'package:json_annotation/json_annotation.dart';
import 'package:markd/core/constants/app_constants.dart';

part 'media_model.g.dart';

/// A single media item (movie or TV show) in the MARKD catalog.
@JsonSerializable()
class Media {
  final int id;
  final String title;
  final String? overview;
  @JsonKey(name: 'poster_path')
  final String? posterPath;
  @JsonKey(name: 'backdrop_path')
  final String? backdropPath;
  final double? voteAverage;
  @JsonKey(defaultValue: 'movie')
  final String mediaType;
  final int? releaseYear;
  final String? tagline;
  @JsonKey(defaultValue: <String>[])
  final List<String> genres;
  @JsonKey(name: 'runtime_minutes')
  final int? runtimeMinutes;

  const Media({
    required this.id,
    required this.title,
    this.overview,
    this.posterPath,
    this.backdropPath,
    this.voteAverage,
    this.mediaType = 'movie',
    this.releaseYear,
    this.tagline,
    this.genres = const <String>[],
    this.runtimeMinutes,
  });

  factory Media.fromJson(Map<String, dynamic> json) => _$MediaFromJson(json);

  Map<String, dynamic> toJson() => _$MediaToJson(this);

  bool get isTv => mediaType == 'tv';

  /// Poster image URL at the given width (TMDB serves w92–w500 for posters).
  String? posterUrl([int width = 342]) {
    final p = posterPath;
    if (p == null) return null;
    return '${AppConstants.tmdbImageBase}/w$width$p';
  }

  /// Backdrop image URL at the given width (TMDB serves w780/w1280).
  String? backdropUrl([int width = 780]) {
    final b = backdropPath;
    if (b == null) return null;
    return '${AppConstants.tmdbImageBase}/w$width$b';
  }
}
