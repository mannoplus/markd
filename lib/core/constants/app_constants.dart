import 'package:flutter/material.dart';

/// Application-wide constants.
class AppConstants {
  AppConstants._();

  /// Base URL for the MARKD API / TMDB proxy.
  /// TODO: wire to the real backend or environment config.
  static const String apiBaseUrl = 'https://api.markd.app';

  /// TMDB image base (poster / backdrop).
  static const String tmdbImageBase = 'https://image.tmdb.org/t/p';

  /// App display name.
  static const String appName = 'MARKD';

  /// Bottom navigation destinations.
  static const List<NavDestination> navDestinations = [
    NavDestination(label: 'Home', icon: Icons.home_outlined, activeIcon: Icons.home),
    NavDestination(label: 'Discover', icon: Icons.explore_outlined, activeIcon: Icons.explore),
    NavDestination(label: 'Library', icon: Icons.bookmark_outline, activeIcon: Icons.bookmark),
    NavDestination(label: 'Profile', icon: Icons.person_outline, activeIcon: Icons.person),
  ];
}

class NavDestination {
  const NavDestination({
    required this.label,
    required this.icon,
    required this.activeIcon,
  });
  final String label;
  final IconData icon;
  final IconData activeIcon;
}
