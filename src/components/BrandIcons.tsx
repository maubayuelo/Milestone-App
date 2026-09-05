import React from 'react';

export const GoogleMeetIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#F8FAFC" />
    <path d="M6 8.5C6 7.67157 6.67157 7 7.5 7H13.5C14.3284 7 15 7.67157 15 8.5V15.5C15 16.3284 14.3284 17 13.5 17H7.5C6.67157 17 6 16.3284 6 15.5V8.5Z" fill="#00832D" />
    <path d="M15 10.5L18.2 8.1C18.6 7.8 19 8.1 19 8.6V15.4C19 15.9 18.6 16.2 18.2 15.9L15 13.5V10.5Z" fill="#0066DA" />
    <path d="M6 14.5V15.5C6 16.3284 6.67157 17 7.5 17H11.5L6 14.5Z" fill="#00AC47" />
    <path d="M15 8.5V9.5L11.5 7H13.5C14.3284 7 15 7.67157 15 8.5Z" fill="#2684FC" />
    <path d="M6 8.5C6 7.67157 6.67157 7 7.5 7H9.5L6 9.5V8.5Z" fill="#FFBA00" />
    <path d="M6 11.5L9.5 14H6V11.5Z" fill="#EA4335" />
  </svg>
);

export const ZoomIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#2D8CFF" />
    <path d="M7 10C7 9.44772 7.44772 9 8 9H13C13.5523 9 14 9.44772 14 10V14C14 14.5523 13.5523 15 13 15H8C7.44772 15 7 14.5523 7 14V10Z" fill="white" />
    <path d="M14 11.2L16.6 9.25C16.85 9.06 17.2 9.24 17.2 9.55V14.45C17.2 14.76 16.85 14.94 16.6 14.75L14 12.8V11.2Z" fill="white" />
  </svg>
);

export const GitLabLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M22.65 14.39L20.5 7.78C20.35 7.33 19.72 7.33 19.57 7.78L17.5 14.16H6.5L4.43 7.78C4.28 7.33 3.65 7.33 3.5 7.78L1.35 14.39C1.19 14.88 1.36 15.42 1.77 15.72L12 23.16L22.23 15.72C22.64 15.42 22.81 14.88 22.65 14.39Z" fill="#E24329" />
    <path d="M12 23.16L17.5 14.16H6.5L12 23.16Z" fill="#E24329" />
    <path d="M12 23.16L6.5 14.16H1.35C1.19 14.88 1.36 15.42 1.77 15.72L12 23.16Z" fill="#FC6D26" />
    <path d="M12 23.16L17.5 14.16H22.65C22.81 14.88 22.64 15.42 22.23 15.72L12 23.16Z" fill="#FC6D26" />
    <path d="M1.35 14.39L3.5 7.78C3.65 7.33 4.28 7.33 4.43 7.78L6.5 14.16H1.35C1.19 14.88 1.35 14.39 1.35 14.39Z" fill="#FCA326" />
    <path d="M22.65 14.39L20.5 7.78C20.35 7.33 19.72 7.33 19.57 7.78L17.5 14.16H22.65C22.81 14.88 22.65 14.39 22.65 14.39Z" fill="#FCA326" />
  </svg>
);

export const GitHubLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const NineTLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <div className={`${className} rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white font-extrabold text-[10px]`}>
    9
  </div>
);

export const HorizonLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <div className={`${className} rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-extrabold text-[10px]`}>
    U
  </div>
);
