import type { AiChatMessage, AiChatContext, ParsedMovieIntent } from './types';

export class MockAiProvider {
  public async chat(
    messages: AiChatMessage[],
    contextInfo?: AiChatContext,
    locale: string = 'en'
  ): Promise<string> {
    const isZh = locale === 'zh-TW' || locale.startsWith('zh');
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const lower = lastUserMessage.toLowerCase();

    if (contextInfo?.title) {
      if (lower.includes('ending') || lower.includes('結尾') || lower.includes('結局')) {
        if (isZh) {
          return `《${contextInfo.title}》的結局深刻探討了命運、選擇與人性的多面性。導演透過象徵性的鏡頭語言，將角色內在的情感掙扎具象化，留下讓人回味無窮的哲思空間。`;
        }
        return `The conclusion of *${contextInfo.title}* offers a profound reflection on destiny, choice, and humanity. Through poignant visual metaphors, the director mirrors the character's internal transformation, leaving a resonant philosophical aftertaste.`;
      }

      if (lower.includes('theme') || lower.includes('主題') || lower.includes('象徵')) {
        if (isZh) {
          return `《${contextInfo.title}》的核心主題圍繞著時間的流逝、記憶的不可靠以及人與人之間跨越隔閡的連結。作品以細膩的節奏建構出獨特的氛圍與情感張力。`;
        }
        return `At its core, *${contextInfo.title}* explores themes of temporal perception, the fragility of memory, and emotional connection across boundaries. Its deliberate pacing crafts an immersive emotional atmosphere.`;
      }
    }

    if (lower.includes('sci-fi') || lower.includes('科幻') || lower.includes('interstellar') || lower.includes('星際')) {
      if (isZh) {
        return `為您精選幾部兼具宏大視覺想像與深層哲理的科幻神作。這些作品不僅擁有燒腦的世界觀構建，更深入探討人類情感與未知的交會點。`;
      }
      return `Here are a few visionary sci-fi works that pair expansive world-building with profound philosophical depth, echoing the atmospheric weight and emotional resonance you enjoy.`;
    }

    if (isZh) {
      return `很高興為您推薦！MARKD 影劇 AI 已根據您的觀影偏好與探索意圖，為您篩選出最契合的幾部精選作品。`;
    }
    return `I've analyzed your taste profile and query to handpick a few compelling films that match your preferred atmosphere and storytelling depth.`;
  }

  public async generateSuggestions(
    contextInfo?: AiChatContext,
    messages: AiChatMessage[] = [],
    locale: string = 'en'
  ): Promise<string[]> {
    const isZh = locale === 'zh-TW' || locale.startsWith('zh');

    if (contextInfo?.title) {
      if (isZh) {
        return [
          `《${contextInfo.title}》的核心主題是什麼？`,
          `推薦與《${contextInfo.title}》風格相似的電影`,
          `請解析這部作品的結局與隱喻`,
          `這部電影的導演還有哪些代表作？`,
        ];
      }
      return [
        `What are the central themes of ${contextInfo.title}?`,
        `Recommend movies with a similar tone to this`,
        `Explain the ending and symbolism`,
        `Who directed this and what else did they make?`,
      ];
    }

    if (isZh) {
      return [
        '推薦類似《星際效應》的燒腦科幻片',
        '想看兩小時以內的感人催淚電影',
        '看完《異星入境》後該看哪部？',
        '推薦幾部節奏沉浸的慢熱心理驚悚片',
      ];
    }

    return [
      'Recommend something like Interstellar',
      'I want a sad movie under two hours',
      'What should I watch after Arrival?',
      'Show me slow-burn psychological thrillers',
    ];
  }

  public async parseIntent(userQuery: string, locale: string = 'en'): Promise<ParsedMovieIntent> {
    const lower = userQuery.toLowerCase();
    const genres: number[] = [];
    const moods: string[] = [];
    let maxRuntime: number | undefined = undefined;
    const referenceTitles: string[] = [];

    // Genre extraction
    if (lower.includes('sci-fi') || lower.includes('科幻') || lower.includes('space') || lower.includes('太空')) {
      genres.push(878);
      moods.push('mind-bending', 'thought-provoking');
    }
    if (lower.includes('thriller') || lower.includes('驚悚') || lower.includes('suspense') || lower.includes('懸疑')) {
      genres.push(53, 9648);
      moods.push('suspenseful', 'dark');
    }
    if (lower.includes('sad') || lower.includes('cry') || lower.includes('emotional') || lower.includes('感人') || lower.includes('催淚') || lower.includes('drama')) {
      genres.push(18);
      moods.push('emotional', 'tragic');
    }
    if (lower.includes('funny') || lower.includes('comedy') || lower.includes('喜劇') || lower.includes('幽默') || lower.includes('cozy')) {
      genres.push(35);
      moods.push('funny', 'hopeful');
    }

    // Runtime extraction
    if (lower.includes('2 hour') || lower.includes('two hour') || lower.includes('兩小時') || lower.includes('120 min') || lower.includes('120 分鐘')) {
      maxRuntime = 120;
    } else if (lower.includes('90 min') || lower.includes('100 min') || lower.includes('90 分鐘') || lower.includes('短片')) {
      maxRuntime = 100;
    }

    // Reference title extraction
    if (lower.includes('interstellar') || lower.includes('星際效應')) referenceTitles.push('Interstellar');
    if (lower.includes('arrival') || lower.includes('異星入境')) referenceTitles.push('Arrival');
    if (lower.includes('inception') || lower.includes('全面啟動')) referenceTitles.push('Inception');
    if (lower.includes('shutter island') || lower.includes('隔離島')) referenceTitles.push('Shutter Island');

    return {
      genres: genres.length > 0 ? genres : [878, 18],
      moods,
      themes: [],
      maxRuntime,
      referenceTitles,
      pacing: lower.includes('slow') ? 'slow' : lower.includes('fast') ? 'fast' : 'balanced',
      isSeekingRecommendations: true,
    };
  }
}
