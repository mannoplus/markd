import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:markd/core/theme/app_colors.dart';

/// Profile: account header, Taste DNA mood preferences, go-to rewatch
/// favorites, and a genre breakdown visualizer.
class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _Mood {
  const _Mood(this.title, this.subtitle, this.icon);
  final String title;
  final String subtitle;
  final IconData icon;
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  static const _moods = [
    _Mood('Mind-Bending & Suspense', 'High tension & twists',
        Icons.psychology_outlined),
    _Mood('Feel Good & Cozy', 'Comfort & easy laughs', Icons.wb_sunny_outlined),
    _Mood('Dark & Gritty', 'Atmospheric depth', Icons.nights_stay_outlined),
    _Mood('High Energy & Adrenaline', 'Action & fast pulse',
        Icons.bolt_outlined),
  ];

  static const _rewatchPicks = ['Interstellar', 'The Prestige', 'Severance'];

  static const _genreBreakdown = [
    ('Sci-Fi', 0.92),
    ('Drama', 0.74),
    ('Mystery', 0.61),
    ('Action', 0.48),
    ('Thriller', 0.35),
  ];

  final Set<int> _selectedMoods = {0, 2};
  final Set<String> _rewatch = {'Interstellar'};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            tooltip: 'Settings',
            onPressed: () {},
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
        children: [
          _AccountHeader(),
          const SizedBox(height: 24),
          _SectionTitle('TASTE DNA', 'Viewing Mood'),
          const SizedBox(height: 4),
          Text(
            'Pick the moods that match your taste. We use these to tune your recommendations.',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: AppColors.foregroundMuted),
          ),
          const SizedBox(height: 12),
          for (var i = 0; i < _moods.length; i++)
            _MoodCard(
              mood: _moods[i],
              selected: _selectedMoods.contains(i),
              onToggle: () => setState(() {
                _selectedMoods.contains(i)
                    ? _selectedMoods.remove(i)
                    : _selectedMoods.add(i);
              }),
            ),
          const SizedBox(height: 24),
          _SectionTitle('GO-TO REWATCH', 'Comfort classics'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final pick in _rewatchPicks)
                FilterChip(
                  label: Text(pick),
                  selected: _rewatch.contains(pick),
                  showCheckmark: false,
                  onSelected: (on) => setState(() {
                    on ? _rewatch.add(pick) : _rewatch.remove(pick);
                  }),
                ),
            ],
          ),
          const SizedBox(height: 24),
          _SectionTitle('GENRE BREAKDOWN', 'What you watch most'),
          const SizedBox(height: 12),
          _GenreBars(genres: _genreBreakdown),
          const SizedBox(height: 24),
          _SettingsGroup(),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.eyebrow, this.title);

  final String eyebrow;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.6,
            color: AppColors.foregroundMuted,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          title,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
            color: AppColors.foreground,
          ),
        ),
      ],
    );
  }
}

class _AccountHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
              ),
            ),
            child: const Text(
              'AK',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Alex Kwan',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'alex@markd.app',
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: AppColors.foregroundMuted,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0x296366F1),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: const Color(0x4D6366F1)),
                  ),
                  child: const Text(
                    'CINEPHILE MEMBER',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.0,
                      color: Color(0xFFA5B4FC),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MoodCard extends StatelessWidget {
  const _MoodCard({
    required this.mood,
    required this.selected,
    required this.onToggle,
  });

  final _Mood mood;
  final bool selected;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? AppColors.accentMuted : AppColors.backgroundCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppColors.borderHover : AppColors.border,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(mood.icon,
                size: 22,
                color: selected ? AppColors.foreground : AppColors.foregroundMuted),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    mood.title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: selected
                          ? AppColors.foreground
                          : AppColors.foregroundSecondary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    mood.subtitle,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: AppColors.foregroundMuted,
                    ),
                  ),
                ],
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? AppColors.accent : Colors.transparent,
                border: Border.all(
                  color: selected ? AppColors.accent : AppColors.borderHover,
                  width: 1.5,
                ),
              ),
              child: selected
                  ? const Icon(Icons.check_rounded,
                      size: 14, color: Colors.black)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}


class _GenreBars extends StatelessWidget {
  const _GenreBars({required this.genres});

  final List<(String, double)> genres;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          for (final (genre, weight) in genres)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  SizedBox(
                    width: 76,
                    child: Text(
                      genre,
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: AppColors.foregroundSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: weight,
                        minHeight: 8,
                        backgroundColor: AppColors.accentSubtle,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          Color(0xFF6366F1),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 34,
                    child: Text(
                      '${(weight * 100).round()}%',
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.foregroundMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.backgroundCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _SettingsTile(
              icon: Icons.notifications_outlined, label: 'Notifications'),
          const Divider(height: 1, indent: 52),
          _SettingsTile(icon: Icons.language_outlined, label: 'Language'),
          const Divider(height: 1, indent: 52),
          _SettingsTile(
              icon: Icons.workspace_premium_outlined, label: 'Membership'),
          const Divider(height: 1, indent: 52),
          _SettingsTile(icon: Icons.logout_rounded, label: 'Sign Out'),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, size: 20, color: AppColors.foregroundSecondary),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      trailing: const Icon(Icons.chevron_right_rounded,
          size: 20, color: AppColors.foregroundMuted),
      onTap: () {},
    );
  }
}

