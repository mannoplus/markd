import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:markd/core/theme/app_colors.dart';
import 'package:markd/features/home/data/models/media_model.dart';
import 'package:markd/shared/widgets/media_card.dart';

/// A horizontal, smooth-scrolling media shelf with an editorial section header,
/// mirroring the web `.media-rail`. Renders a loading skeleton while [async]
/// is pending.
class MediaRail extends StatelessWidget {
  const MediaRail({
    super.key,
    required this.title,
    required this.async,
    required this.onOpen,
    this.eyebrow,
    this.subtitle,
    this.cardWidth = 130,
  });

  /// Section title, e.g. "Because you loved The Batman".
  final String title;

  /// Optional eyebrow label shown above the title.
  final String? eyebrow;

  /// Optional muted description under the title.
  final String? subtitle;

  /// Async list of media to show.
  final AsyncValue<List<Media>> async;

  /// Called when a card is tapped.
  final ValueChanged<Media> onOpen;

  final double cardWidth;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          eyebrow: eyebrow,
          title: title,
          subtitle: subtitle,
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: cardWidth * 1.5 + 46,
          child: _buildBody(),
        ),
      ],
    );
  }

  Widget _buildBody() {
    if (async.isLoading) {
      return const _RailSkeleton(cardWidth: 130);
    }
    final items = async.value ?? const [];
    if (items.isEmpty) {
      return const SizedBox.shrink();
    }
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: items.length,
      separatorBuilder: (_, _) => const SizedBox(width: 12),
      itemBuilder: (context, index) {
        final media = items[index];
        return MediaCard(
          width: cardWidth,
          media: media,
          heroTag: 'card-${media.id}',
          onTap: () => onOpen(media),
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({this.eyebrow, required this.title, this.subtitle});

  final String? eyebrow;
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (eyebrow != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text(
                eyebrow!.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.6,
                  color: AppColors.foregroundMuted,
                ),
              ),
            ),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.3,
                ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}

class _RailSkeleton extends StatelessWidget {
  const _RailSkeleton({required this.cardWidth});

  final double cardWidth;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: 6,
      separatorBuilder: (_, _) => const SizedBox(width: 12),
      itemBuilder: (_, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: cardWidth,
            height: cardWidth * 1.5,
            decoration: BoxDecoration(
              color: AppColors.backgroundCard,
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: cardWidth * 0.7,
            height: 12,
            decoration: BoxDecoration(
              color: AppColors.backgroundHighlight,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }
}