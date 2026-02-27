import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class LanguageModel extends Model {
    static table = 'languages';

    @field('code') code!: string;
    @field('name') name!: string;
    @field('native_name') nativeName!: string;
    @field('locale') locale!: string;
    @field('flag') flag!: string;
    @field('stt_locale') sttLocale!: string;
    @field('tts_voice_id') ttsVoiceId!: string;
}
