export interface Language {
    code: string;
    label: string;
    flag: string;
}

export const LANGUAGES: Language[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', label: 'French', flag: '🇫🇷' },
    { code: 'de', label: 'German', flag: '🇩🇪' },
    { code: 'jp', label: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
    { code: 'ko', label: 'Korean', flag: '🇰🇷' },
    { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
    { code: 'it', label: 'Italian', flag: '🇮🇹' },
    { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { code: 'ru', label: 'Russian', flag: '🇷🇺' },
];
