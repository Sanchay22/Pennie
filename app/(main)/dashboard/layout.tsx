"use client";

import { Suspense } from "react";
import { BarLoader } from "react-spinners";
import DashboardPage  from "./page"; 

const Layout: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-5 mt-25">
        <h1 className="text-6xl font-bold tracking-tight gradient-title">
          Dashboard
        </h1>
      </div>
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <DashboardPage />
      </Suspense>
    </div>
  );
};

export default Layout;
