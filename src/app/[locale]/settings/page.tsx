'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
    HelpCircle, Eye, EyeOff, Save, Key, Globe, Info, CheckCircle, Settings, ShieldCheck, ShieldAlert, Shield, Lock, User as UserIcon
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// SVG Brand Logos as clean, uniformly sized inline components
const OpenAiLogo = () => (
    <svg className="w-5 h-5 text-[#10a37f] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.74 11.53c0-.62-.12-1.22-.36-1.78l-1.92 1.11c.02.22.04.44.04.67 0 2.2-1.2 4.14-3 5.17l1.11 1.92c2.51-1.45 4.13-4.14 4.13-7.09zm-8.8 8.8c.62 0 1.22-.12 1.78-.36l-1.11-1.92c-.22.02-.44.04-.67.04-2.2 0-4.14-1.2-5.17-3l-1.92 1.11c1.45 2.51 4.14 4.13 7.09 4.13zm-7.09-4.13c-.24-.56-.36-1.16-.36-1.78 0-2.95 1.62-5.64 4.13-7.09l-1.11-1.92c-3.52 2.03-5.22 5.92-4.52 9.87l1.86-1.08zm1.08-9.87c.56-.24 1.16-.36 1.78-.36 2.95 0 5.64 1.62 7.09 4.13l1.92-1.11C18.63 4.13 15.94 2.51 13 2.51c-.62 0-1.22.12-1.78.36l1.11 1.92c.22-.02.44-.04.67-.04zm9.87 1.08c.24.56.36 1.16.36 1.78 0 2.2-1.2 4.14-3 5.17l1.11 1.92c2.51-1.45 4.13-4.14 4.13-7.09 0-.62-.12-1.22-.36-1.78l-1.92 1.11c-.02-.22-.04-.44-.04-.67 0-2.2 1.2-4.14 3-5.17l-1.11-1.92c-2.51 1.45-4.13 4.14-4.13 7.09zm-8.8-8.8c-.62 0-1.22.12-1.78.36l1.11 1.92c.22-.02.44-.04.67-.04 2.2 0 4.14 1.2 5.17 3l1.92-1.11C18.63 4.13 15.94 2.51 13 2.51z"/>
    </svg>
);

const AnthropicLogo = () => (
    <svg className="w-5 h-5 text-[#cc785c] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.8 20.3h-3.4l-1.1-3.6H6.7l-1.1 3.6H2.2L8.5 3.7h3.1l6.2 16.6zm-5.4-7.2l-2.4-7.8h-.2l-2.4 7.8h5zM22.5 8.1c0 1.2-.9 2.2-2.2 2.2s-2.2-1-2.2-2.2.9-2.2 2.2-2.2 2.2 1 2.2 2.2z"/>
    </svg>
);

const MistralLogo = () => (
    <svg className="w-5 h-5 text-[#fd531e] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.7 3.7H15l-3 6.2-3-6.2H4.3v16.6H9V9.9l3 6.2 3-6.2v10.4h4.7V3.7z"/>
    </svg>
);

const KimiLogo = () => (
    <svg className="w-5 h-5 text-[#ff6b00] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <path d="M9 7.5v9h2v-3.5h2l2 3.5h2.5L15 12.5l2.5-5H15l-2.5 4h-1.5v-4H9z" />
    </svg>
);

const QwenLogo = () => (
    <svg className="w-5 h-5 text-[#6236ff] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
    </svg>
);

const MetaLogo = () => (
    <svg className="w-5 h-5 text-[#0064e0] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.25 12c0-2.82-1.92-5.4-4.83-5.4-1.97 0-3.37.95-4.42 2.45-1.05-1.5-2.45-2.45-4.42-2.45C5.67 6.6 3.75 9.18 3.75 12c0 2.82 1.92 5.4 4.83 5.4 1.97 0 3.37-.95 4.42-2.45 1.05 1.5 2.45 2.45 4.42 2.45 2.91 0 4.83-2.58 4.83-5.4zm-13.67 4.1c-2.12 0-3.53-1.8-3.53-4.1 0-2.3 1.41-4.1 3.53-4.1 1.41 0 2.45.83 3.19 2.15l.08.15c-.75 1.34-1.78 2.15-3.19 2.15l-.08-.15c-.74-1.32-1.78-2.15-3.19-2.15z"/>
    </svg>
);

const GlmLogo = () => (
    <svg className="w-5 h-5 text-[#3b82f6] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="4"/>
    </svg>
);

const DeepseekLogo = () => (
    <svg className="w-5 h-5 text-[#1b76ff] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3-9h6v2H9z"/>
    </svg>
);

const GrokLogo = () => (
    <svg className="w-5 h-5 text-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l16 16M4 20L20 4"/>
    </svg>
);

const MinimaxLogo = () => (
    <svg className="w-5 h-5 text-[#ff3b30] shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="6" width="4" height="12" rx="1.5"/>
        <rect x="10" y="4" width="4" height="16" rx="1.5"/>
        <rect x="17" y="6" width="4" height="12" rx="1.5"/>
    </svg>
);

const PROVIDERS = [
    { id: 'openai', label: 'OpenAI', url: 'https://platform.openai.com', logo: OpenAiLogo },
    { id: 'anthropic', label: 'Anthropic', url: 'https://console.anthropic.com', logo: AnthropicLogo },
    { id: 'mistral', label: 'Mistral', url: 'https://console.mistral.ai', logo: MistralLogo },
    { id: 'kimi', label: 'Kimi (Moonshot)', url: 'https://platform.moonshot.cn', logo: KimiLogo },
    { id: 'qwen', label: 'Qwen (Alibaba)', url: 'https://dashscope.console.aliyun.com', logo: QwenLogo },
    { id: 'meta', label: 'Meta AI (Groq)', url: 'https://console.groq.com', logo: MetaLogo },
    { id: 'glm', label: 'GLM (Zhipu)', url: 'https://open.bigmodel.cn', logo: GlmLogo },
    { id: 'deepseek', label: 'DeepSeek', url: 'https://platform.deepseek.com', logo: DeepseekLogo },
    { id: 'grok', label: 'Grok (xAI)', url: 'https://console.x.ai', logo: GrokLogo },
    { id: 'minimax', label: 'MiniMax', url: 'https://platform.minimaxi.com', logo: MinimaxLogo }
];

export default function SettingsPage() {
    const t = useTranslations('Settings');
    const router = useRouter();
    const pathname = usePathname();

    const [activeTab, setActiveTab] = useState<'apiKeys' | 'general' | 'account'>('apiKeys');
    const [keys, setKeys] = useState<Record<string, string>>({});
    const [visibility, setVisibility] = useState<Record<string, boolean>>({});
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [activeProvider, setActiveProvider] = useState<string>('openai');
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Supabase auth user state
    const [user, setUser] = useState<User | null>(null);
    const [isUserLoading, setIsUserLoading] = useState(true);

    // Validation state
    const [validationStates, setValidationStates] = useState<Record<string, 'active' | 'inactive' | 'invalid' | 'validating'>>({});

    // General Preferences Settings
    const [defaultTimeframe, setDefaultTimeframe] = useState('day');
    const [autoPlayTrailers, setAutoPlayTrailers] = useState(true);

    const validateKey = async (providerId: string, keyValue: string) => {
        if (!keyValue.trim()) {
            setValidationStates(prev => ({ ...prev, [providerId]: 'inactive' }));
            return;
        }

        setValidationStates(prev => ({ ...prev, [providerId]: 'validating' }));

        try {
            const res = await fetch('/api/ai/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerId, apiKey: keyValue })
            });
            const data = await res.json();
            setValidationStates(prev => ({ 
                ...prev, 
                [providerId]: data.valid ? 'active' : 'invalid' 
            }));
        } catch {
            setValidationStates(prev => ({ ...prev, [providerId]: 'invalid' }));
        }
    };

    useEffect(() => {
        const loaded: Record<string, string> = {};
        PROVIDERS.forEach((prov) => {
            loaded[prov.id] = localStorage.getItem(`markd_apikey_${prov.id}`) || '';
        });
        const timeframe = localStorage.getItem('markd_pref_timeframe') || 'day';
        const autoplay = localStorage.getItem('markd_pref_autoplay') !== 'false';

        // Load Supabase User
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            setIsUserLoading(false);
        }).catch(() => {
            setIsUserLoading(false);
        });

        setTimeout(() => {
            setKeys(loaded);
            setDefaultTimeframe(timeframe);
            setAutoPlayTrailers(autoplay);

            // Execute validation check on loaded keys
            PROVIDERS.forEach((prov) => {
                if (loaded[prov.id]) {
                    validateKey(prov.id, loaded[prov.id]);
                } else {
                    setValidationStates(prev => ({ ...prev, [prov.id]: 'inactive' }));
                }
            });
        }, 0);
    }, []);

    const handleSaveKeys = async (e: React.FormEvent) => {
        e.preventDefault();
        PROVIDERS.forEach((prov) => {
            localStorage.setItem(`markd_apikey_${prov.id}`, keys[prov.id] || '');
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);

        // Run validation for all keys
        for (const prov of PROVIDERS) {
            await validateKey(prov.id, keys[prov.id] || '');
        }
    };

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('markd_pref_timeframe', defaultTimeframe);
        localStorage.setItem('markd_pref_autoplay', String(autoPlayTrailers));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const toggleVisibility = (id: string) => {
        setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleLanguageChange = (newLang: string) => {
        const segments = pathname.split('/');
        segments[1] = newLang;
        router.push(segments.join('/'));
    };

    const getHelpContent = (provId: string) => {
        switch (provId) {
            case 'openai':
                return {
                    en: 'Go to OpenAI platform (platform.openai.com), sign in, navigate to API Keys section under dashboard, and click "Create new secret key".',
                    zh: '前往 OpenAI 平台 (platform.openai.com) 登入，進入儀表板中的 API Keys 區段，點擊 "Create new secret key" 建立新金鑰。'
                };
            case 'anthropic':
                return {
                    en: 'Log in to Anthropic Console (console.anthropic.com), navigate to "API Keys" dashboard menu, and generate your Anthropic client key.',
                    zh: '登入 Anthropic 控制台 (console.anthropic.com)，導航至 "API Keys" 選單，並生成您的 Anthropic 客戶端金鑰。'
                };
            case 'mistral':
                return {
                    en: 'Log in to Mistral Console (console.mistral.ai), navigate to API Keys and click "Create new key".',
                    zh: '登入 Mistral 控制台 (console.mistral.ai)，進入 API Keys 區段並點擊 "Create new key" 建立新金鑰。'
                };
            case 'kimi':
                return {
                    en: 'Visit Moonshot Platform (platform.moonshot.cn), open API Keys page, and click "Create" to generate your Kimi Chat token.',
                    zh: '訪問 Moonshot 開放平台 (platform.moonshot.cn)，打開 API Keys 頁面，點擊 "新建" 獲取您的 Kimi 對話金鑰。'
                };
            case 'qwen':
                return {
                    en: 'Access Alibaba Cloud DashScope console (dashscope.console.aliyun.com), open "API-KEY Management" page, and create a new Access Token.',
                    zh: '登入阿里雲 DashScope 靈積控制台 (dashscope.console.aliyun.com)，打開 "API-KEY 管理" 頁面建立新的存取金鑰。'
                };
            case 'meta':
                return {
                    en: 'Sign in to Groq Console (console.groq.com), open the API Keys setting page, and generate your LLama/Meta inference token.',
                    zh: '登入 Groq 控制台 (console.groq.com)，進入 API Keys 設定頁面，並生成您的 Llama/Meta 推理金鑰。'
                };
            case 'glm':
                return {
                    en: 'Log in to Zhipu Big Model platform (open.bigmodel.cn), access user dashboard, open API Keys menu, and copy your client token.',
                    zh: '登入智譜 AI 大模型開放平台 (open.bigmodel.cn)，進入個人中心，打開 API Keys 選單並複製您的金鑰字串。'
                };
            case 'deepseek':
                return {
                    en: 'Log in to DeepSeek Platform (platform.deepseek.com), navigate to API Keys, and generate your DeepSeek chat key.',
                    zh: '登入 DeepSeek 開放平台 (platform.deepseek.com)，導航至 API Keys，生成並複製您的 DeepSeek 金鑰。'
                };
            case 'grok':
                return {
                    en: 'Access xAI Console (console.x.ai), open the API Keys tab in your dashboard settings, and generate a Grok API client key.',
                    zh: '存取 xAI 控制台 (console.x.ai)，打開帳戶設定中的 API Keys 頁籤，並建立 Grok API 客戶端金鑰。'
                };
            case 'minimax':
                return {
                    en: 'Visit MiniMax Platform (platform.minimaxi.com), go to API Keys page under developer account dashboard, and generate a new key.',
                    zh: '訪問 MiniMax 開放平台 (platform.minimaxi.com)，前往開發者後台 API 金鑰頁面生成並複製新金鑰。'
                };
            default:
                return { en: '', zh: '' };
        }
    };

    // Render Status Badge
    const renderStatusBadge = (provId: string) => {
        const state = validationStates[provId] || 'inactive';
        switch (state) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" />
                        {t('active')}
                    </span>
                );
            case 'validating':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-yellow-400 animate-ping" />
                        {t('validating')}
                    </span>
                );
            case 'invalid':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20">
                        <ShieldAlert className="h-3 w-3" />
                        {t('invalidKey')}
                    </span>
                );
            case 'inactive':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-foreground-muted bg-background-elevated border border-border/10">
                        <Shield className="h-3 w-3" />
                        {t('keyRequired')}
                    </span>
                );
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mt-16 md:mt-24 fade-in font-sans">
            {/* Page Header */}
            <div className="border-b border-border/25 pb-4 mb-8">
                <h1 className="text-3xl font-black tracking-tight">{t('title')}</h1>
            </div>

            {/* Split Panel Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
                
                {/* Left Navigation Sidebar */}
                <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-border/25 lg:pr-4 shrink-0 snap-x">
                    <button
                        onClick={() => setActiveTab('apiKeys')}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 snap-start w-full justify-start ${
                            activeTab === 'apiKeys'
                                ? 'bg-accent/15 text-accent border-l-2 border-accent'
                                : 'text-foreground-muted hover:bg-background-elevated hover:text-foreground'
                        }`}
                    >
                        <Key className="h-4 w-4" />
                        <span>{t('apiKeysTab')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 snap-start w-full justify-start ${
                            activeTab === 'general'
                                ? 'bg-accent/15 text-accent border-l-2 border-accent'
                                : 'text-foreground-muted hover:bg-background-elevated hover:text-foreground'
                        }`}
                    >
                        <Settings className="h-4 w-4" />
                        <span>{t('general')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 snap-start w-full justify-start ${
                            activeTab === 'account'
                                ? 'bg-accent/15 text-accent border-l-2 border-accent'
                                : 'text-foreground-muted hover:bg-background-elevated hover:text-foreground'
                        }`}
                    >
                        <UserIcon className="h-4 w-4" />
                        <span>{pathname.startsWith('/zh-TW') ? '帳戶與同步' : 'Account & Sync'}</span>
                    </button>
                </div>

                {/* Right Panel Contents */}
                <div className="space-y-6">
                    
                    {/* Panel 1: API Key Configuration */}
                    {activeTab === 'apiKeys' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between border-b border-border/15 pb-3">
                                <div className="space-y-0.5">
                                    <h2 className="text-lg font-black tracking-wider uppercase text-foreground">{t('apiKeys')}</h2>
                                    <p className="text-xs text-foreground-muted">Configure and persist your custom LLM provider api tokens.</p>
                                </div>
                                <button
                                    onClick={() => setIsHelpOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30 font-bold text-xs text-accent hover:bg-accent/25 transition-all cursor-pointer shadow-md"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                    <span>{t('help')}</span>
                                </button>
                            </div>

                            {/* Ultra Compact Card Grid Layout (e.g. 3 or 4 columns on large screens) */}
                            <form onSubmit={handleSaveKeys} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 bg-[#0c0c12]/40 border border-border/20 rounded-2xl p-4 shadow-xl">
                                    {PROVIDERS.map((prov) => {
                                        const LogoIcon = prov.logo;
                                        return (
                                            <div key={prov.id} className="space-y-2 bg-[#12121a]/60 border border-border/10 p-3 rounded-xl flex flex-col justify-between hover:border-border/35 transition-all duration-200">
                                                <div className="flex justify-between items-start gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <LogoIcon />
                                                        <span className="text-[11px] font-black text-foreground truncate">{prov.label}</span>
                                                    </div>
                                                    <a
                                                        href={prov.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] text-accent hover:underline font-bold shrink-0"
                                                    >
                                                        Link →
                                                    </a>
                                                </div>
                                                
                                                {/* Security Mask Input Box */}
                                                <div className="relative rounded-lg overflow-hidden border border-border/20 focus-within:border-accent/40 transition-colors bg-background">
                                                    <input
                                                        type={visibility[prov.id] ? 'text' : 'password'}
                                                        value={keys[prov.id] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setKeys({ ...keys, [prov.id]: val });
                                                            // On-the-fly validation after debounce / blur can run, but let's test immediately
                                                        }}
                                                        onBlur={(e) => validateKey(prov.id, e.target.value)}
                                                        placeholder={`Enter your ${prov.label} API Key here`}
                                                        className="w-full bg-transparent px-2.5 py-1.5 text-[11px] focus:outline-none pr-8 text-foreground"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleVisibility(prov.id)}
                                                        className="absolute right-2 top-2 text-foreground-muted hover:text-foreground cursor-pointer"
                                                    >
                                                        {visibility[prov.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </button>
                                                </div>

                                                {/* Persistent Badge Status Indicators */}
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[9px] text-foreground-muted font-bold">Status:</span>
                                                    {renderStatusBadge(prov.id)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Save Notification */}
                                {saveSuccess && (
                                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 text-sm font-semibold transition-all">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>{t('saved')}</span>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-black uppercase tracking-wider text-background hover:bg-accent-hover active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-accent/20"
                                    >
                                        <Save className="h-4 w-4" />
                                        {t('save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Panel 2: General Preferences Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {/* Panel Header */}
                            <div className="border-b border-border/15 pb-3">
                                <h2 className="text-lg font-black tracking-wider uppercase text-foreground">{t('general')}</h2>
                                <p className="text-xs text-foreground-muted">Configure general website preferences and client options.</p>
                            </div>

                            <form onSubmit={handleSaveGeneral} className="space-y-6">
                                <div className="bg-[#0c0c12]/40 border border-border/20 rounded-2xl p-5 space-y-6 shadow-xl">
                                    {/* 1. Language Toggle */}
                                    <div className="space-y-2 pb-5 border-b border-border/15">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Global Language</h3>
                                                <p className="text-[11px] text-foreground-muted">Switch system-wide default UI and AI assistant language.</p>
                                            </div>
                                            <div className="flex bg-[#12121a] p-1 rounded-lg border border-border/25">
                                                <button
                                                    type="button"
                                                    onClick={() => handleLanguageChange('en')}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                                                        pathname.startsWith('/en')
                                                            ? 'bg-accent text-background shadow-md'
                                                            : 'text-foreground-muted hover:text-foreground'
                                                    }`}
                                                >
                                                    English
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleLanguageChange('zh-TW')}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all cursor-pointer ${
                                                        pathname.startsWith('/zh-TW')
                                                            ? 'bg-accent text-background shadow-md'
                                                            : 'text-foreground-muted hover:text-foreground'
                                                    }`}
                                                >
                                                    繁體中文
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Default Timeframe option */}
                                    <div className="space-y-2 pb-5 border-b border-border/15">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Trending Timeframe</h3>
                                                <p className="text-[11px] text-foreground-muted">Select the default time period for trending carousels.</p>
                                            </div>
                                            <select
                                                value={defaultTimeframe}
                                                onChange={(e) => setDefaultTimeframe(e.target.value)}
                                                className="bg-[#12121a] text-xs font-bold text-foreground border border-border/25 rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent/40 transition-colors"
                                            >
                                                <option value="day">Today (Day)</option>
                                                <option value="week">This Week (Week)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* 3. Autoplay Trailers */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Autoplay Trailer Previews</h3>
                                                <p className="text-[11px] text-foreground-muted">Autoplay muted trailer embeds when hovering over media cards.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={autoPlayTrailers}
                                                    onChange={(e) => setAutoPlayTrailers(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-[#1c1c28] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground-muted peer-checked:after:bg-background after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Notification */}
                                {saveSuccess && (
                                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 text-sm font-semibold transition-all">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>{t('saved')}</span>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-black uppercase tracking-wider text-background hover:bg-accent-hover active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-accent/20"
                                    >
                                        <Save className="h-4 w-4" />
                                        Save Preferences
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Panel 3: Account & Cloud Sync (Protected Sub-Section) */}
                    {activeTab === 'account' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="border-b border-border/15 pb-3">
                                <h2 className="text-lg font-black tracking-wider uppercase text-foreground">
                                    {pathname.startsWith('/zh-TW') ? '帳戶與雲端同步' : 'Account & Cloud Sync'}
                                </h2>
                                <p className="text-xs text-foreground-muted">
                                    {pathname.startsWith('/zh-TW') ? '管理您的雲端資料庫個人檔案與影劇清單同步設定。' : 'Manage your cloud database profile and watchlist synchronization settings.'}
                                </p>
                            </div>

                            {isUserLoading ? (
                                <div className="bg-[#0c0c12]/40 border border-border/20 rounded-2xl p-8 flex justify-center items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
                                </div>
                            ) : user ? (
                                <div className="bg-[#0c0c12]/40 border border-border/20 rounded-2xl p-5 space-y-6 shadow-xl">
                                    <div className="flex items-center gap-4 bg-[#12121a]/60 border border-border/15 p-4 rounded-xl">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 border border-accent/40 text-accent font-black text-lg">
                                            {user.email?.[0]?.toUpperCase() ?? 'U'}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground">{user.email}</h3>
                                            <p className="text-[10px] text-foreground-muted">User ID: {user.id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-[#12121a]/60 border border-border/15 p-4 rounded-xl">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                                            {pathname.startsWith('/zh-TW') ? '同步功能列表' : 'Sync Capabilities'}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2">
                                            <div className="flex items-center gap-2 text-foreground-muted">
                                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                <span>{pathname.startsWith('/zh-TW') ? '影劇清單已同步' : 'Watchlist Synced'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-foreground-muted">
                                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                <span>{pathname.startsWith('/zh-TW') ? 'API 金鑰已同步' : 'API Keys Synced'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-foreground-muted">
                                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                <span>{pathname.startsWith('/zh-TW') ? '個人設定已同步' : 'Preferences Synced'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-foreground-muted">
                                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                <span>{pathname.startsWith('/zh-TW') ? '多裝置雲端備份' : 'Multi-device active backups'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#0c0c12]/40 border border-border/20 rounded-2xl p-8 text-center space-y-4 shadow-xl">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/25 text-yellow-400">
                                        <Lock className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1.5 max-w-md mx-auto">
                                        <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                                            {pathname.startsWith('/zh-TW') ? '雲端存取已鎖定' : 'Cloud Access Locked'}
                                        </h3>
                                        <p className="text-xs text-foreground-muted leading-relaxed leading-5">
                                            {pathname.startsWith('/zh-TW') 
                                                ? '請先登入以啟用雲端同步功能。擁有 MARKD 帳戶後，您可以在所有裝置上安全地同步您的追蹤清單、設定及自訂 AI 金鑰。' 
                                                : 'Please sign in to unlock cloud synchronization features. With a MARKD account, you can synchronize your watchlist, preferences, and custom AI keys securely across all devices.'
                                            }
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <Link
                                            href="/login"
                                            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-black uppercase tracking-wider text-background hover:bg-accent-hover active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-accent/20"
                                        >
                                            {pathname.startsWith('/zh-TW') ? '登入以啟用雲端同步' : 'Sign In to Cloud Sync'}
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bilingual Onboarding Help Modal */}
            {isHelpOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsHelpOpen(false)} />
                    <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0c0c12] border border-border p-6 shadow-2xl z-10 space-y-6">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-border/20 pb-3">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Info className="h-5 w-5 text-accent" />
                                {t('bilingualHelp')}
                            </h2>
                            <button
                                onClick={() => setIsHelpOpen(false)}
                                className="text-xs font-bold text-foreground-muted hover:text-foreground cursor-pointer"
                            >
                                Close
                            </button>
                        </div>

                        {/* Layout: Sidebar Providers + Bilingual Detail View (Side-by-Side) */}
                        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 text-sm">
                            <div className="flex flex-col gap-1.5 border-b md:border-b-0 md:border-r border-border/10 pb-4 md:pb-0 md:pr-4">
                                {PROVIDERS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setActiveProvider(p.id)}
                                        className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            activeProvider === p.id 
                                                ? 'bg-accent/15 text-accent border-l-2 border-accent' 
                                                : 'text-foreground-muted hover:bg-background-elevated'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-base font-bold text-accent">
                                    {PROVIDERS.find((p) => p.id === activeProvider)?.label} Key Guide
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* English Instruction block */}
                                    <div className="space-y-2 bg-background-elevated/20 p-4 rounded-xl border border-border/10">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80">
                                            <Globe className="h-4 w-4 text-blue-400" />
                                            <span>English Instructions</span>
                                        </div>
                                        <p className="text-xs text-foreground-muted leading-relaxed font-sans mt-2">
                                            {getHelpContent(activeProvider).en}
                                        </p>
                                    </div>

                                    {/* Chinese Instruction block */}
                                    <div className="space-y-2 bg-background-elevated/20 p-4 rounded-xl border border-border/10">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80">
                                            <Globe className="h-4 w-4 text-emerald-400" />
                                            <span>中文說明</span>
                                        </div>
                                        <p className="text-xs text-foreground-muted leading-relaxed font-sans mt-2">
                                            {getHelpContent(activeProvider).zh}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
