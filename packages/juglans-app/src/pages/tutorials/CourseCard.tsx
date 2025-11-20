// packages/juglans-app/src/pages/tutorials/CourseCard.tsx
import { Component, For } from 'solid-js';
import { A } from '@solidjs/router';
import { Dynamic } from 'solid-js/web';
import type { Course } from './data';

// Import the necessary icon components
import BookIcon from '@/components/icons/BookIcon';
import TrendingUpIcon from '@/components/icons/TrendingUpIcon';
import RobotIcon from '@/components/icons/RobotIcon';
import WalletIcon from '@/components/icons/WalletIcon';
// For the second course, let's use some existing icons as placeholders
import SlidersIcon from '@/components/icons/SlidersIcon'; 

interface CourseCardProps {
  course: Course;
}

// Create a mapping from string identifiers to components
const iconMap = {
  book: BookIcon,
  chart: TrendingUpIcon,
  ai: RobotIcon,
  wallet: WalletIcon,
  support: SlidersIcon, // Placeholder
  indicators: SlidersIcon, // Placeholder
  volume: SlidersIcon, // Placeholder
  patterns: SlidersIcon, // Placeholder
  fibonacci: SlidersIcon, // Placeholder
};


const CourseCard: Component<CourseCardProps> = (props) => {
  return (
    <A href={`/tutorials/courses/${props.course.slug}`} class="course-card">
      <div class="course-card-header">
        <h3 class="course-card-title">{props.course.title}</h3>
        <span class="course-card-see-all">See all ({props.course.units.length})</span>
      </div>
      <ul class="course-card-unit-list">
        <For each={props.course.units.slice(0, 5)}>
          {(unit) => (
            <li class="course-card-unit-item">
              {/* Replace the placeholder with a dynamic icon */}
              <span class="unit-icon">
                <Dynamic component={iconMap[unit.icon]} />
              </span>
              <span>{unit.title}</span>
            </li>
          )}
        </For>
      </ul>
    </A>
  );
};

export default CourseCard;