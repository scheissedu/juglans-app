// packages/juglans-app/src/articles/types.ts
import { Component } from 'solid-js';

// Type for bilingual content
export type i18nString = {
  en: string;
  zh: string;
};

// The main interface for a single article
export interface Article {
  slug: string;
  title: i18nString;
  description: i18nString;
  image: string;
  category: string[];
  // The content is a SolidJS component
  Component: Component;
}