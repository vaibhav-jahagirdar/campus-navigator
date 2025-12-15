import React from "react";

export function Flipper({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block [perspective:400px]">
      <span className="block transition-transform duration-300 [transform-style:preserve-3d] group-hover:rotate-x-90 group-hover:opacity-0">
        {children}
      </span>
      <span className="block absolute left-0 top-0 transition-transform duration-300 [transform-style:preserve-3d] rotate-x-90 opacity-0 group-hover:rotate-x-0 group-hover:opacity-100 text-blue-600">
        {children}
      </span>
    </span>
  );
}