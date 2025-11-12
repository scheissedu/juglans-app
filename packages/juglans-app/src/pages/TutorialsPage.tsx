// packages/juglans-app/src/pages/TutorialsPage.tsx
import { Component } from 'solid-js';
import './TutorialsPage.css';

const TutorialsPage: Component = () => {
  return (
    <div class="tutorials-page-container">
      <header class="tutorials-header">
        <h1>Tutorials & Learning Center</h1>
        <p>Master Juglans from the basics to advanced strategies.</p>
      </header>
      
      <main class="tutorials-content">
        <section class="tutorials-section">
          <h2 class="section-title">Quick Tips</h2>
          <div class="quick-tips-grid">
            {/* 占位符 - 稍后将替换为 TutorialCard 组件 */}
            <div class="tutorial-card-placeholder">What is a Candlestick?</div>
            <div class="tutorial-card-placeholder">How to use the AI Assistant?</div>
            <div class="tutorial-card-placeholder">Drawing a Trend Line</div>
            <div class="tutorial-card-placeholder">Understanding MACD</div>
          </div>
        </section>

        <section class="tutorials-section">
          <h2 class="section-title">In-depth Courses</h2>
          <div class="courses-list">
            {/* 占位符 - 稍后将替换为 CourseListItem 组件 */}
            <div class="course-item-placeholder">Juglans Beginner's Bootcamp</div>
            <div class="course-item-placeholder">Technical Analysis Masterclass</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TutorialsPage;