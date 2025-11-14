import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

type LayoutProps = {
  children?: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-layout flex h-screen">
      <Sidebar />
      <div className="main flex-1 flex flex-col">
        <TopBar />
        <main className="p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

