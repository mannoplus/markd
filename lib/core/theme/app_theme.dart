import 'package:flutter/material.dart';
import 'package:markd/core/theme/app_colors.dart';

/// Dark, cinematic Material theme for MARKD.
class AppTheme {
  AppTheme._();

  static ThemeData get dark {
    const base = ColorScheme.dark(
      brightness: Brightness.dark,
      primary: AppColors.accent,
      onPrimary: Colors.black,
      secondary: AppColors.accentSecondary,
      surface: AppColors.backgroundCard,
      error: AppColors.error,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: base,
      scaffoldBackgroundColor: AppColors.background,
      canvasColor: AppColors.background,
      primaryColor: AppColors.accent,
      dividerColor: AppColors.border,
      // Typography
      fontFamily: 'Inter',
      textTheme: const TextTheme(
        displayLarge: TextStyle(color: AppColors.foreground, fontWeight: FontWeight.w700),
        displayMedium: TextStyle(color: AppColors.foreground, fontWeight: FontWeight.w700),
        displaySmall: TextStyle(color: AppColors.foreground, fontWeight: FontWeight.w600),
        headlineMedium: TextStyle(color: AppColors.foreground, fontWeight: FontWeight.w600),
        headlineSmall: TextStyle(color: AppColors.foreground, fontWeight: FontWeight.w600),
        titleLarge: TextStyle(color: AppColors.foreground, fontWeight: FontWeight.w600),
        titleMedium: TextStyle(color: AppColors.foreground, fontWeight: FontWeight.w500),
        bodyLarge: TextStyle(color: AppColors.foregroundSecondary),
        bodyMedium: TextStyle(color: AppColors.foregroundSecondary),
        bodySmall: TextStyle(color: AppColors.foregroundMuted),
        labelLarge: TextStyle(color: AppColors.foreground, fontWeight: FontWeight.w600),
      ),
      // App bar
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: AppColors.foreground,
        titleTextStyle: TextStyle(
          color: AppColors.foreground,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
      ),
      // Bottom navigation
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.backgroundSecondary,
        selectedItemColor: AppColors.accent,
        unselectedItemColor: AppColors.foregroundMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      // Cards
      cardTheme: CardThemeData(
        color: AppColors.backgroundCard,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: EdgeInsets.zero,
      ),
      // Inputs
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.backgroundElevated,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.accent),
        ),
        hintStyle: const TextStyle(color: AppColors.foregroundMuted),
      ),
      // Progress indicator
      progressIndicatorTheme:
          const ProgressIndicatorThemeData(color: AppColors.accent),
      // Chip
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.backgroundElevated,
        selectedColor: AppColors.accentMuted,
        labelStyle: const TextStyle(color: AppColors.foreground),
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
    );
  }
}
