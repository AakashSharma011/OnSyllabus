import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import SelectCollege from "./pages/SelectCollege.jsx";
import SelectBranch from "./pages/SelectBranch.jsx";
import SubjectList from "./pages/SubjectList.jsx";
import UnitList from "./pages/UnitList.jsx";
import UnitDetail from "./pages/UnitDetail.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />

      <Route path="/colleges" element={<ProtectedRoute><SelectCollege /></ProtectedRoute>} />
      <Route path="/branches" element={<ProtectedRoute><SelectBranch /></ProtectedRoute>} />
      <Route path="/subjects" element={<ProtectedRoute><SubjectList /></ProtectedRoute>} />
      <Route path="/units" element={<ProtectedRoute><UnitList /></ProtectedRoute>} />
      <Route path="/unit/:unitId" element={<ProtectedRoute><UnitDetail /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
    </Routes>
  );
}