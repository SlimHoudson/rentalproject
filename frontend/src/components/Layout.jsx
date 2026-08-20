import React from 'react';
import Header from './Header';
import ChatWidget from './ChatWidget';

const Layout = ({ children, title }) => {
  return (
    <div
      className="min-h-screen flex flex-col w-full"
      style={{ fontFamily: 'Inter, sans-serif', background: 'var(--bg-main)' }}
    >
      {/* Header / Navbar */}
      <Header title={title} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full box-border">
        {children}
      </main>

      {/* Global Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Layout;
