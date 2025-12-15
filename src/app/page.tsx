'use client';

import { useState } from 'react';
import Preloader from './components/Preloader';
import LandingPage from './components/LandingPage';
import Features from './components/FeatureSection';

export default function Home() {
  const [isDone, setIsDone] = useState(false);

  return isDone ? (
    <>
      <LandingPage />
      <Features />
    </>
  ) : (
    <Preloader onComplete={() => setIsDone(true)} />
  );
}
