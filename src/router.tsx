import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import Overview from "@/pages/Overview";
import Documentation from "@/pages/Documentation";
import AdminPanel from "@/pages/AdminPanel";
import ProtectedRoute from "@/components/ProtectedRoute";

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
  { 
    path: "/admin", 
    element: (
      <ProtectedRoute>
        <AdminPanel />
      </ProtectedRoute>
    )
  },
]);