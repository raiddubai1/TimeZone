"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AdSensePlaceholderProps {
  size?: "banner" | "square" | "skyscraper";
  className?: string;
}

// TODO: Replace this placeholder with <ins class="adsbygoogle"> ... </ins> snippet once AdSense account is ready
// Example implementation:
// <ins className="adsbygoogle"
//      style={{ display: "block" }}
//      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
//      data-ad-slot="XXXXXXXXXX"
//      data-ad-format="auto"
//      data-full-width-responsive="true"></ins>
// <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>

export default function AdSensePlaceholder({ 
  size = "banner", 
  className 
}: AdSensePlaceholderProps) {
  // Size configurations
  const sizeConfig = {
    banner: {
      width: "728",
      height: "90",
      mobileWidth: "320",
      mobileHeight: "50",
      text: "AdSense Banner",
      className: "w-full max-w-4xl h-24 md:h-24"
    },
    square: {
      width: "300",
      height: "250",
      mobileWidth: "300",
      mobileHeight: "250",
      text: "AdSense Square",
      className: "w-80 h-64"
    },
    skyscraper: {
      width: "160",
      height: "600",
      mobileWidth: "160",
      mobileHeight: "600",
      text: "AdSense Skyscraper",
      className: "w-40 h-96"
    }
  };

  const config = sizeConfig[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={cn(
        // Base styles
        "flex items-center justify-center",
        "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700",
        "border-2 border-dashed border-gray-300 dark:border-gray-600",
        "rounded-lg",
        "overflow-hidden",
        // Responsive sizing
        config.className,
        className
      )}
    >
      <div className="text-center p-4">
        <div className="text-gray-600 dark:text-gray-400 font-medium text-sm md:text-base mb-1">
          {config.text} Placeholder
        </div>
        <div className="text-gray-500 dark:text-gray-500 text-xs md:text-sm">
          {/* Show responsive dimensions */}
          <span className="hidden sm:inline">
            {config.width} × {config.height}
          </span>
          <span className="sm:hidden inline">
            {config.mobileWidth} × {config.mobileHeight}
          </span>
          {" "}Advertisement Space
        </div>
        
        {/* Visual indicator for ad type */}
        <div className="mt-2 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>
    </motion.div>
  );
}