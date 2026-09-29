"use client";

import { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";


interface CardData {
  company: string;
  image: string;
  title: string;
  description: string;
  tags: string[];
  link: string;
}

const cards: CardData[] = [
  {
    company: "Smart Attendance",
    image: "/crm-sliderImage.jfif",
    title: "AI-Powered Time Tracking",
    description:
      "Log your shifts seamlessly from any device. Our intelligent system ensures your hours are tracked accurately and helps prevent missed clock-outs.",
    tags: ["AI Tracking", "Live Sync", "Timesheets"],
    link: "#",
  },
  {
    company: "Leave Management",
    image: "/crm-siderImage7.png",
    title: "Intelligent Status Requests",
    description:
      "Not coming in today? Submit WFH or Leave requests in seconds. Our automated routing speeds up admin reviews and updates your availability instantly.",
    tags: ["Automation", "WFH", "Approvals"],
    link: "#",
  },
  {
    company: "Employee Portal",
    image: "/crm-sliderImage22.webp",
    title: "AI-Driven Weekly Insights",
    description:
      "Track your attendance streaks, review your total hours, and get personalized insights into your work patterns all in one unified dashboard.",
    tags: ["AI Analytics", "Insights", "Dashboard"],
    link: "#",
  },
];

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize AOS once
  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-out-cubic", once: true });
  }, []);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
      AOS.refresh(); // re-trigger animation
    }, 3000);
    return () => clearInterval(interval);
  }, []);

 

  const currentCard = cards[currentIndex];

  return (
    <section className="relative  px-0 pt-1 md:px-10   text-white flex flex-col  ">
      <div className="relative flex flex-col items-center justify-center w-full max-w-[1200px] mx-auto">
        {/* Image Card */}
        <div
          key={currentIndex}
          data-aos="fade-down"
          className="relative overflow-hidden rounded-md w-full transition-all duration-700"
        >
         
          <div className=" relative ">
             <img
            src={currentCard.image}
            alt={currentCard.title}
            className="object-cover w-full h-[22vh]  rounded-xs"
          />
          <div className=" absolute top-0 left-0 h-full w-full bg-black/35"></div>
          </div>

          <div
           
            data-aos-delay="150"
            className="absolute bottom-0 left-0 p-6 sm:p-10 md:p-12 space-y-4  rounded-xs w-full"
          >
        

            <h2
              data-aos="fade-right"
              data-aos-delay="300"
              className="text-white text-shadow-black text-shadow-2xl text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
            >
              {currentCard.title}
            </h2>

           
          </div>
        </div>

       
      </div>
    </section>
  );
}