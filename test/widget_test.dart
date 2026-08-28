import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:markd/main.dart';

void main() {
  testWidgets('MARKD app boots and shows bottom navigation', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MarkdApp()));
    await tester.pumpAndSettle();

    // Bottom nav labels from AppConstants.navDestinations.
    expect(find.text('Home'), findsWidgets);
    expect(find.text('Discover'), findsWidgets);
    expect(find.text('Library'), findsWidgets);
    expect(find.text('Profile'), findsWidgets);

    // Unmount the app so widgets (e.g. HeroCarousel's periodic auto-advance
    // Timer) are disposed, then pump to let pending timers/animations clear.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(seconds: 8));
  });
}
