// packages/juglans-app/src/courses/index.ts
import type { Course } from './types';
import { BeginnersBootcampCourse } from './juglans-beginners-bootcamp/index.course';
// To add a new course, import it here...

export const courses = new Map<string, Course>([
  [BeginnersBootcampCourse.slug, BeginnersBootcampCourse],
  // ...and add it to the map here.
]);