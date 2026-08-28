import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:markd/main.dart';

void main() {
  test('MARKD WebView shell instantiates cleanly', () {
    const app = MarkdApp();
    const screen = WebViewScreen();

    // The app shell and full-screen WebView wrapper (rendering
    // https://markd-it.vercel.app) must be instantiable widgets.
    expect(app, isA<Widget>());
    expect(screen, isA<Widget>());
  });
}
