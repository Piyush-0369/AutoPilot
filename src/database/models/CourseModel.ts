import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class CourseModel extends Model {
    static table = 'courses';

    @field('language_id') languageId!: string;
    @field('title') title!: string;
    @field('description') description!: string;
    @field('cefr_level') cefrLevel!: string;
    @field('total_units') totalUnits!: number;
    @field('image_url') imageUrl!: string;
}
