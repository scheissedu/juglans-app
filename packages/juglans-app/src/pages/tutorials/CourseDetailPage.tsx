// packages/juglans-app/src/pages/tutorials/CourseDetailPage.tsx
import { Component, createMemo, For, Show, createSignal, onMount } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { Dynamic } from 'solid-js/web'; // Import Dynamic
import { courses } from '@/courses'; // Use new course registry
import VideoIcon from './VideoIcon';
import ArticleIcon from './ArticleIcon';
import './CourseDetailPage.css';

const CourseDetailPage: Component = () => {
  const params = useParams();
  const [activeUnitId, setActiveUnitId] = createSignal('');

  const course = createMemo(() => {
    return courses.get(params.slug); // Get course from map
  });

  onMount(() => {
    const c = course();
    if (c && c.units.length > 0) {
      setActiveUnitId(c.units[0].id);
    }
  });

  const handleUnitClick = (unitId: string) => {
    setActiveUnitId(unitId);
    const element = document.getElementById(unitId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div class="course-detail-page">
      <Show when={course()} fallback={<div>Course not found.</div>}>
        {(c) => (
          <>
            <aside class="course-sidebar">
              <div class="course-sidebar-header">
                <h2 class="sidebar-course-title">{c().title}</h2>
                <p class="sidebar-course-meta">{c().units.length} UNITS</p>
              </div>
              <nav class="course-sidebar-nav">
                <ul>
                  <For each={c().units}>
                    {(unit, index) => (
                      <li>
                        <a 
                          href={`#${unit.id}`}
                          class="course-sidebar-nav-item"
                          classList={{ active: activeUnitId() === unit.id }}
                          onClick={(e) => { e.preventDefault(); handleUnitClick(unit.id); }}
                        >
                          <span class="course-unit-number">UNIT {index() + 1}</span>
                          <span class="course-unit-title">{unit.title}</span>
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </nav>
            </aside>

            <main class="course-main-content">
              <nav class="breadcrumb">
                <A href="/tutorials">Tutorials</A>
                <span>&nbsp;&gt;&nbsp;</span>
                <span>{c().title}</span>
              </nav>
              <h1 class="main-course-title">{c().title}</h1>
              
              <For each={c().units}>
                {(unit, index) => (
                  <section class="unit-section" id={unit.id}>
                    <div class="unit-header">
                      <h3>Unit {index() + 1}: {unit.title}</h3>
                    </div>
                    {/* --- CORE FIX: Render lesson content directly --- */}
                    <For each={unit.lessons}>
                      {(lesson) => (
                        <div class="lesson-content-wrapper">
                          <div class="lesson-header">
                            <Show when={lesson.type === 'video'} fallback={<ArticleIcon />}>
                              <VideoIcon />
                            </Show>
                            <div class="lesson-info">
                              <h4 class="lesson-title">{lesson.title}</h4>
                              <span class="lesson-duration">{lesson.duration}</span>
                            </div>
                          </div>
                          <div class="lesson-body article-body">
                             <Dynamic component={lesson.Component} />
                          </div>
                        </div>
                      )}
                    </For>
                  </section>
                )}
              </For>
            </main>
          </>
        )}
      </Show>
    </div>
  );
};

export default CourseDetailPage;