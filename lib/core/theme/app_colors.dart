import 'package:flutter/material.dart';

/// MARKD cinematic color palette.
/// Mirrors the web app: white accent on deep charcoal/black.
class AppColors {
  // Backgrounds
  static const background = Color(0xFF0a0c11);
  static const backgroundSecondary = Color(0xFF0f1219);
  static const backgroundCard = Color(0xFF131722);
  static const backgroundElevated = Color(0xFF1a1f2d);
  static const backgroundHighlight = Color(0xFF222838);

  // Foreground / text
  static const foreground = Color(0xFFf5f5f8);
  static const foregroundSecondary = Color(0xFFc9c9d6);
  static const foregroundMuted = Color(0xFF9090a4);
  static const foregroundSubtle = Color(0xFF5c5c70);

  // Accent (monochrome white)
  static const accent = Color(0xFFFFFFFF);
  static const accentHover = Color(0xFFe6e6ec);
  static const accentMuted = Color(0x1Fffffff); // ~rgba(255,255,255,0.12)
  static const accentSubtle = Color(0x0Dffffff); // ~rgba(255,255,255,0.05)
  static const accentGlow = Color(0x38ffffff); // ~rgba(255,255,255,0.22)
  static const accentSecondary = Color(0xFF9aa3b2);

  // Semantic
  static const success = Color(0xFF34d399);
  static const warning = Color(0xFFfbbf24);
  static const error = Color(0xFFf87171);
  static const info = Color(0xFF38bdf8);

  // Borders
  static const border = Color(0x14ffffff); // rgba(255,255,255,0.08)
  static const borderSubtle = Color(0x0Dffffff); // 0.05
  static const borderHover = Color(0x2Effffff); // 0.18

  static const goldStar = Color(0xFFeab308);
}
