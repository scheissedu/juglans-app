// packages/juglans-app/src/courses/types.ts
import { Component } from 'solid-js';

export interface Lesson {
  slug: string;
  title: string;
  type: 'article' | 'video';
  duration: string;
  Component: Component; // The actual lesson content
}

export interface Unit {
  id: string; // Used for anchoring
  title: string;
  icon: 'book' | 'chart' | 'ai' | 'wallet' | 'support' | 'indicators' | 'volume' | 'patterns' | 'fibonacci';
  lessons: Lesson[];
}

export interface Course {
  slug: string;
  title: string;
  description: string;
  units: Unit[];
}