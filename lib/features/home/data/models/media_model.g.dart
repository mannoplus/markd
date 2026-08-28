// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'media_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Media _$MediaFromJson(Map<String, dynamic> json) => Media(
  id: (json['id'] as num).toInt(),
  title: json['title'] as String,
  overview: json['overview'] as String?,
  posterPath: json['poster_path'] as String?,
  backdropPath: json['backdrop_path'] as String?,
  voteAverage: (json['voteAverage'] as num?)?.toDouble(),
  mediaType: json['mediaType'] as String? ?? 'movie',
  releaseYear: (json['releaseYear'] as num?)?.toInt(),
  tagline: json['tagline'] as String?,
  genres:
      (json['genres'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      [],
  runtimeMinutes: (json['runtime_minutes'] as num?)?.toInt(),
  popularity: (json['popularity'] as num?)?.toDouble() ?? 0.0,
);

Map<String, dynamic> _$MediaToJson(Media instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'overview': instance.overview,
  'poster_path': instance.posterPath,
  'backdrop_path': instance.backdropPath,
  'voteAverage': instance.voteAverage,
  'mediaType': instance.mediaType,
  'releaseYear': instance.releaseYear,
  'tagline': instance.tagline,
  'genres': instance.genres,
  'runtime_minutes': instance.runtimeMinutes,
  'popularity': instance.popularity,
};
