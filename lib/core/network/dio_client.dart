import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:markd/core/constants/app_constants.dart';

/// Configured Dio client with interceptors for timeouts, headers, and
/// centralized error handling. Swap the base URL via [AppConstants.apiBaseUrl].
final dioClientProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ),
  );

  dio.interceptors.add(
    LogInterceptor(requestBody: false, responseBody: false),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (err, handler) {
        // Centralized error normalization can be added here.
        handler.next(err);
      },
    ),
  );

  return dio;
});
