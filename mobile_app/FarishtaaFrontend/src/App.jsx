import { useEffect } from "react";
import { useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./nav/NavBar.jsx";
import HomePage from "./components/Homepage.jsx";
import Signup from "./components/auth/Signup.jsx";
import Login from "./components/auth/Login.jsx";
import AISymptomsChecker from "./components/patient/AISymptomsChecker.jsx";
import Categories from "./components/doctor/Categories.jsx";
import DoctorByCategory from "./components/doctor/DoctorByCategory.jsx";
import DoctorProfile from "./components/doctor/DoctorProfile.jsx";
import FloatingAIButton from "./components/patient/FloatingAIButton.jsx";
import DoctorLayout from "./components/doctor/dashboard/DoctorLayout.jsx";
import DoctorDashboard from "./components/doctor/dashboard/DoctorDashboard.jsx";
import DoctorProfileEdit from "./components/doctor/dashboard/DoctorProfileEdit.jsx";
import DoctorReviews from "./components/doctor/dashboard/DoctorReviews.jsx";
import DoctorSettings from "./components/doctor/dashboard/DoctorSettings.jsx";
import HospitalLayout from "./components/hospital/dashboard/HospitalLayout.jsx";
import HospitalDashboard from "./components/hospital/dashboard/HospitalDashboard.jsx";
import HospitalDoctors from "./components/hospital/dashboard/HospitalDoctors.jsx";
import AddDoctor from "./components/hospital/dashboard/AddDoctor.jsx";
import HospitalDoctorDetail from "./components/hospital/dashboard/HospitalDoctorDetail.jsx";
import HospitalSettings from "./components/hospital/dashboard/HospitalSettings.jsx";

function App() {
  const { darkMode } = useSelector((state) => state.theme);
  const { isLoggedIn, userType } = useSelector((state) => state.auth);
  const authRedirect = isLoggedIn ? (userType === 'Doctor' ? '/doctor-dashboard' : userType === 'Hospital' ? '/hospital-dashboard' : '/') : null;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <NavBar />
        <FloatingAIButton />

        <main className="flex-grow w-full dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={authRedirect ? <Navigate to={authRedirect} replace /> : <Login />} />
            <Route path="/signup" element={authRedirect ? <Navigate to={authRedirect} replace /> : <Signup />} />

            {/* Patient routes */}
            <Route path="/symptoms/:userId" element={<AISymptomsChecker />} />
            <Route path="/symptoms/:userId/:sessionId" element={<AISymptomsChecker />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/nearby-search/:category" element={<DoctorByCategory />} />
            <Route path="/doctor/:doctorId" element={<DoctorProfile />} />

            {/* Doctor dashboard routes */}
            <Route path="/doctor-dashboard" element={<DoctorLayout />}>
              <Route index element={<DoctorDashboard />} />
              <Route path="profile" element={<DoctorProfileEdit />} />
              <Route path="reviews" element={<DoctorReviews />} />
              <Route path="settings" element={<DoctorSettings />} />
            </Route>

            {/* Hospital dashboard routes */}
            <Route path="/hospital-dashboard" element={<HospitalLayout />}>
              <Route index element={<HospitalDashboard />} />
              <Route path="doctors" element={<HospitalDoctors />} />
              <Route path="doctors/:doctorId" element={<HospitalDoctorDetail />} />
              <Route path="add-doctor" element={<AddDoctor />} />
              <Route path="settings" element={<HospitalSettings />} />
            </Route>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
