import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import AIChatBubble from '../ai/AIChatBubble';

const AppShell = () => {
  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-bg-primary pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <AIChatBubble />
    </div>
  );
};

export default AppShell;
