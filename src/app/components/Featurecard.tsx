import React from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div
      className="feature-card 
        text-black 
        rounded-[2.5rem] 
        bg-gray-50
        flex flex-col items-center 
        shadow-lg 
        transition-all duration-500 
        hover:scale-105 hover:shadow-2xl
        w-[370px] h-[420px] 
        px-10 py-10 
        gap-6
        "
    >
      <div className="feature-icon mb-3 text-7xl">
        {icon}
      </div>

      <h3 className="feature-title font-sfpro font-semibold tracking-[-0.04em] text-4xl text-black text-center">
        {title}
      </h3>

      <p className="feature-description font-sfpro text-[1.305rem] tracking-[-0.04em] font-medium text-gray-600 text-center mb-3">
        {description}
      </p>

      <a 
        href="#" 
        className="explore-link font-sfpro font-semibold text-[1.3rem] tracking-[-0.04em] mt-auto text-blue-600 hover:text-blue-700 hover:underline transition-all"
      >
        Explore →
      </a>
    </div>
  );
};

export default FeatureCard;
