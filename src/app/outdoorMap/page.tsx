'use client';

import React from 'react';
import OutdoorBaseMap from '../components/OutdoorBaseMap';
import Navbar from '../components/Navbar';

export default function OutdoorMapPage() {
  return (
    <main className="w-screen h-screen m-0 p-0 overflow-hidden">
      
      <div className="w-full h-full pt-16">
        <OutdoorBaseMap />
      </div>
    </main>
  );
}