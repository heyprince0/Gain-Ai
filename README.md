# GainAI — Personal Fitness Companion

GainAI helps people build sustainable fitness habits with personalized workouts, nutrition tracking, AI food scanning, body composition insights, and progress tracking.

## Product features

- **Food scanner:** analyze meal photos and log calories, protein, carbohydrates, fats, fiber, and meal quality.
- **Nutrition goals:** set personal calorie and macro targets from profile details and fitness goals.
- **Workout planner:** create a personalized training plan and track completed sessions.
- **Body scanner and progress:** review body composition and fitness trends over time.
- **Personal dashboard:** bring daily workouts, food logs, goals, and progress together.
- **Mobile install:** use GainAI as a responsive web app or installable PWA.

## Account flow

1. Enter an email address.
2. Choose a password.
3. Add personal details: name, age, weight, height, gender, and fitness goal.
4. Continue to the personal fitness dashboard.

Profiles are individual accounts. Gym membership, phone-number matching, and gym assignment are not part of onboarding.

## Stack

- Next.js App Router and TypeScript
- Supabase Auth and PostgreSQL
- Tailwind CSS and shadcn/ui
- AI-assisted food and workout experiences
- Vercel deployment

## Primary routes

- `/` — GainAI overview
- `/dashboard` — personal fitness dashboard
- `/food-scanner` — meal photo analysis
- `/body-scanner` — body composition tracking
- `/progress` — personal fitness progress
- `/profile` — personal details and goals
- `/download` and `/install` — app install guidance
