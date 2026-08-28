import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:markd/core/constants/app_constants.dart';
import 'package:markd/features/discover/presentation/pages/discover_page.dart';
import 'package:markd/features/home/presentation/pages/home_page.dart';
import 'package:markd/features/library/presentation/pages/library_page.dart';
import 'package:markd/features/media_details/presentation/pages/media_details_page.dart';
import 'package:markd/features/profile/presentation/pages/profile_page.dart';

/// Root router with a persistent bottom navigation shell.
final goRouter = GoRouter(
  initialLocation: '/',
  routes: [
    // Full-screen (no bottom tab) media detail.
    GoRoute(
      path: '/details/:id',
      builder: (context, state) => MediaDetailsPage(
        mediaId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0,
      ),
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, shell) => AppScaffold(shell: shell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => const HomePage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/discover',
              builder: (context, state) => const DiscoverPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/library',
              builder: (context, state) => const LibraryPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfilePage(),
            ),
          ],
        ),
      ],
    ),
  ],
);

/// Scaffold that hosts the [StatefulNavigationShell] with a bottom nav bar.
class AppScaffold extends StatelessWidget {
  const AppScaffold({super.key, required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    final destinations = AppConstants.navDestinations;
    return Scaffold(
      body: shell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: shell.currentIndex,
        onTap: (index) => shell.goBranch(index),
        items: [
          for (var i = 0; i < destinations.length; i++)
            BottomNavigationBarItem(
              icon: Icon(destinations[i].icon),
              activeIcon: Icon(destinations[i].activeIcon),
              label: destinations[i].label,
            ),
        ],
      ),
    );
  }
}
