'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
    HelpCircle, Eye, EyeOff, Save, Key, Globe, Info, CheckCircle
} from 'lucide-react';

const PROVIDERS = [
    { id: 'openai', label: 'OpenAI', url: 'https://platform.openai.com' },
    { id: 'anthropic', label: 'Anthropic', url: 'https://console.anthropic.com' },
    { id: 'mistral', label: 'Mistral', url: 'https://console.mistral.ai' },
    { id: 'kimi', label: 'Kimi (Moonshot)', url: 'https://platform.moonshot.cn' },
    { id: 'qwen', label: 'Qwen (Alibaba)', url: 'https://dashscope.console.aliyun.com' },
    { id: 'meta', label: 'Meta AI (Groq)', url: 'https://console.groq.com' },
    { id: 'glm', label: 'GLM (Zhipu)', url: 'https://open.bigmodel.cn' },
    { id: 'deepseek', label: 'DeepSeek', url: 'https://platform.deepseek.com' },
    { id: 'grok', label: 'Grok (xAI)', url: 'https://console.x.ai' },
    { id: 'minimax', label: 'MiniMax', url: 'https://platform.minimaxi.com' }
];

export default function SettingsPage() {
    const t = useTranslations('Settings');
    const [keys, setKeys] = useState<Record<string, string>>({});
    const [visibility, setVisibility] = useState<Record<string, boolean>>({});
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [activeProvider, setActiveProvider] = useState<string>('openai');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const loaded: Record<string, string> = {};
        PROVIDERS.forEach((prov) => {
            loaded[prov.id] = localStorage.getItem(`markd_apikey_${prov.id}`) || '';
        });
        setTimeout(() => {
            setKeys(loaded);
        }, 0);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        PROVIDERS.forEach((prov) => {
            localStorage.setItem(`markd_apikey_${prov.id}`, keys[prov.id] || '');
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const toggleVisibility = (id: string) => {
        setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Bilingual Help guide content details for the 10 providers
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

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 mt-16 md:mt-24 fade-in font-sans">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/25 pb-4 mb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight">{t('title')}</h1>
                    <p className="text-sm text-foreground-muted">{t('apiKeys')}</p>
                </div>
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/30 font-bold text-xs text-accent hover:bg-accent/25 transition-all cursor-pointer shadow-md"
                >
                    <HelpCircle className="h-4 w-4" />
                    <span>{t('help')}</span>
                </button>
            </div>

            {/* Config Form */}
            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-[#0c0c12]/40 border border-border/20 rounded-2xl p-6 space-y-6 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {PROVIDERS.map((prov) => (
                            <div key={prov.id} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                                        <Key className="h-3.5 w-3.5 text-accent" />
                                        {prov.label} Key
                                    </label>
                                    <a
                                        href={prov.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-accent hover:underline font-bold"
                                    >
                                        Get Key →
                                    </a>
                                </div>
                                <div className="relative rounded-xl overflow-hidden border border-border/20 focus-within:border-accent/40 transition-colors bg-background">
                                    <input
                                        type={visibility[prov.id] ? 'text' : 'password'}
                                        value={keys[prov.id] || ''}
                                        onChange={(e) => setKeys({ ...keys, [prov.id]: e.target.value })}
                                        placeholder={`Enter ${prov.label} Key`}
                                        className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none pr-10 text-foreground"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleVisibility(prov.id)}
                                        className="absolute right-3 top-3.5 text-foreground-muted hover:text-foreground cursor-pointer"
                                    >
                                        {visibility[prov.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Success Banner */}
                {saveSuccess && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 text-sm font-semibold transition-all">
                        <CheckCircle className="h-5 w-5" />
                        <span>{t('saved')}</span>
                    </div>
                )}

                {/* Actions */}
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
