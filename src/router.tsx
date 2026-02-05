import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import Overview from "@/pages/Overview";
import Documentation from "@/pages/Documentation";

export const router = createBrowserRouter([
  { 
    path: "/", 
    element: <Login /> 
  },
  { 
    path: "/home", 
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    )
  },
  { 
    path: "/explore", 
    element: (
      <ProtectedRoute>
        <Explore />
      </ProtectedRoute>
    )
  },
  { 
    path: "/overview", 
    element: (
      <ProtectedRoute>
        <Overview />
      </ProtectedRoute>
    )
  },
  { 
    path: "/docs", 
    element: (
      <ProtectedRoute>
        <Documentation />
      </ProtectedRoute>
    )
  },
]);