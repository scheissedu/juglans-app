// packages/juglans-app/src/courses/juglans-beginners-bootcamp/index.course.ts
import type { Course } from '@/courses/types';
import { InterfaceTourLesson } from './lessons/01-interface-tour.lesson';
import { ChartBasicsLesson } from './lessons/02-chart-basics.lesson';
import { UsingAILesson } from './lessons/03-using-the-ai.lesson';
import { ManagingPortfolioLesson } from './lessons/04-managing-portfolio.lesson';

export const BeginnersBootcampCourse: Course = {
  slug: 'juglans-beginners-bootcamp',
  title: "Juglans Beginner's Bootcamp",
  description: "Your complete guide to getting started with Juglans. From your first chart to your first analysis, we've got you covered.",
  units: [
    { 
      id: 'unit-1-1', 
      title: 'Introduction to Juglans', 
      icon: 'book', 
      lessons: [InterfaceTourLesson] 
    },
    { 
      id: 'unit-1-2', 
      title: 'Chart Basics', 
      icon: 'chart', 
      lessons: [ChartBasicsLesson] 
    },
    { 
      id: 'unit-1-3', 
      title: 'Your First Analysis', 
      icon: 'ai', 
      lessons: [UsingAILesson] 
    },
    { 
      id: 'unit-1-4', 
      title: 'Wallet & Account', 
      icon: 'wallet', 
      lessons: [ManagingPortfolioLesson] 
    },
  ],
};