import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class UnitModel extends Model {
    static table = 'units';

    @field('course_id') courseId!: string;
    @field('order_index') orderIndex!: number;
    @field('title') title!: string;
    @field('description') description!: string;
    @field('theme') theme!: string;
    @field('icon') icon!: string;
    @field('total_lessons') totalLessons!: number;
}
