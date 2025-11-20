// packages/juglans-app/src/pages/TutorialsPage.tsx
import { Component, createSignal, createMemo, For } from 'solid-js';
import { quickTipsData, type TipCategory } from './tutorials/data';
import { courses } from '@/courses'; // Import the new course registry
import DiscoverTags, { type DiscoverTag } from '../pages/market/DiscoverTags';
import TipCard from './tutorials/TipCard';
import CourseCard from './tutorials/CourseCard';
import './TutorialsPage.css';

const tipCategories: DiscoverTag[] = [
  { label: 'All', searchTerm: 'all' },
  { label: 'Basic', searchTerm: 'basic' },
  { label: 'Crypto', searchTerm: 'crypto' },
  { label: 'Stocks', searchTerm: 'stocks' },
  { label: 'Predict', searchTerm: 'predict' },
];

const TutorialsPage: Component = () => {
  const [activeCategory, setActiveCategory] = createSignal('all');

  const filteredTips = createMemo(() => {
    const category = activeCategory();
    if (category === 'all') {
      return quickTipsData;
    }
    return quickTipsData.filter(tip => tip.category.includes(category as TipCategory));
  });

  // Get the list of courses from the new pluggable system
  const coursesList = createMemo(() => Array.from(courses.values()));

  return (
    <div class="tutorials-page-container">
      <header class="tutorials-header">
        <h1>Tutorials & Learning Center</h1>
        <p>Master Juglans from the basics to advanced strategies.</p>
      </header>
      
      <main class="tutorials-content">
        <section class="tutorials-section">
          <div class="section-header">
            <h2 class="section-title">Quick Tips</h2>
            {/* Using DiscoverTags component as a filter */}
            <DiscoverTags 
              tags={tipCategories}
              activeTag={activeCategory()}
              onTagClick={(tag) => setActiveCategory(tag)}
            />
          </div>
          {/* Horizontal scroll container for tips */}
          <div class="tips-scroll-container">
            <For each={filteredTips()}>
              {(tip) => <TipCard tip={tip} />}
            </For>
          </div>
        </section>

        <section class="tutorials-section">
          <div class="section-header">
            <h2 class="section-title">In-depth Courses</h2>
          </div>
          <div class="courses-grid">
            <For each={coursesList()}>
              {(course) => <CourseCard course={course} />}
            </For>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TutorialsPage;