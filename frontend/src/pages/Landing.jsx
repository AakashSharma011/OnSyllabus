import { useNavigate } from "react-router-dom";
import LogoIntro from "../components/LogoIntro.jsx";

export default function Landing() {
  const navigate = useNavigate();
  return <LogoIntro onComplete={() => navigate("/home")} />;
}