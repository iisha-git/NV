import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";
import { useToast } from "./ToastContext";

const Auth = ({ setShowLogin }) => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { showToast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  // LOGIN STATES
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // REGISTER STATES
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log(response.data);
      const userData = response.data.user || { email, name: "Advocate Counsel" };
      login(userData);
      setShowLogin?.(false);
      navigate("/workspace");
    } catch (error) {
      console.log(error);

      if (error.response) {
        console.log(error.response.data);
        showToast(error.response.data.message || "Invalid credentials. Please try again.", "error");
      } else {
        console.log("Server unreachable:", error.message);
        showToast("Cannot reach the NyayVivek server. Check that the backend is running and try again.", "error");
      }
    }
  };

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();

    if (registerPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        name,
        email: registerEmail,
        password: registerPassword,
      });

      console.log(response.data);
      const userData = response.data.user || { email: registerEmail, name: name || "Advocate Counsel" };
      login(userData);
      setShowLogin?.(false);
      navigate("/workspace");
    } catch (error) {
      console.log(error);

      if (error.response) {
        console.log(error.response.data);
        showToast(error.response.data.message || "Registration failed. Please try again.", "error");
      } else {
        console.log("Server unreachable:", error.message);
        showToast("Cannot reach the NyayVivek server. Check that the backend is running and try again.", "error");
      }
    }
  };

  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black relative overflow-hidden px-6 py-12 pointer-events-auto">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C8A45D]/[0.06] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#C8A45D]/[0.05] rounded-full blur-[160px] pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center mb-10 select-none">
        <span className="text-[#C8A45D] text-sm font-serif tracking-[0.4em] uppercase font-bold">NyayVivek</span>
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.3em] mt-2">Autonomous Legal Intelligence Cockpit</span>
      </div>

        {/* LOGIN CARD */}
        {!isRegistering && (
          <div className="rounded-2xl border w-full max-w-lg relative z-10 border-[#c5a059]/15 bg-gradient-to-b from-[#0b0b0b] to-[#040404] transition-all duration-500 flex flex-col hover:border-[#c5a059]/40 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(0,0,0,0.85)]">

            <button
              type="button"
              onClick={() => setShowLogin ? setShowLogin(false) : navigate("/")}
              className="absolute top-7 left-5 text-gray-400 hover:text-[#c5a059] transition-all text-xs uppercase tracking-[0.2em] font-mono cursor-pointer"
            >
              ← Go Back
            </button>

            <h2 className="text-2xl font-serif font-bold text-center text-white mt-10 mb-3 tracking-wide">
              Login
            </h2>

            <p className="text-center text-gray-400 text-xs font-light mb-2 px-25">
              Welcome back! Please enter your credentials to access your account.
            </p>

            <form
              onSubmit={handleLogin}
              className="flex mt-5 h-full flex-col gap-6"
            >
              <div className="flex flex-col h-full gap-4 px-10">

                {/* EMAIL */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                    Enter Email
                  </label>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-white text-xs font-serif tracking-normal p-3 rounded focus:outline-none focus:border-[#c5a059] transition-all placeholder:text-gray-400 font-light"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                    Enter Password
                  </label>

                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-white text-xs font-serif tracking-normal p-3 rounded focus:outline-none focus:border-[#c5a059] transition-all placeholder:text-gray-400 font-light"
                  />
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  className="px-8 mt-3 py-3 bg-[#c5a059] text-black hover:bg-[#d6b570] text-xs tracking-widest font-bold uppercase rounded transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(197,160,89,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Login
                </button>

                {/* SWITCH */}
                <div className="flex items-center justify-center mt-4 mb-10">
                  <span className="text-xs font-light text-gray-400">
                    Don't have an account?
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="text-xs font-light ml-1 text-[#c5a059] hover:text-[#d6b570] transition-all cursor-pointer"
                  >
                    Sign up
                  </button>
                </div>

              </div>
            </form>
          </div>
        )}

        {/* REGISTER CARD */}
        {isRegistering && (
          <div className="rounded-2xl border w-full max-w-lg relative z-10 border-[#c5a059]/15 bg-gradient-to-b from-[#0b0b0b] to-[#040404] transition-all duration-500 flex flex-col hover:border-[#c5a059]/40 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(0,0,0,0.85)]">

            <button
              type="button"
              onClick={() => setShowLogin ? setShowLogin(false) : navigate("/")}
              className="absolute top-7 left-5 text-gray-400 hover:text-[#c5a059] transition-all text-xs uppercase tracking-[0.2em] font-mono cursor-pointer"
            >
              ← Go Back
            </button>

            <h2 className="text-2xl font-serif font-bold text-center text-white mt-10 mb-3 tracking-wide">
              Create Account
            </h2>

            <form
              onSubmit={handleRegister}
              className="flex mt-5 h-full flex-col gap-6"
            >
              <div className="flex flex-col h-full gap-4 px-10">

                {/* NAME */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                    Enter Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-white text-xs font-serif tracking-normal p-3 rounded focus:outline-none focus:border-[#c5a059] transition-all placeholder:text-gray-400 font-light"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                    Enter Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-white text-xs font-serif tracking-normal p-3 rounded focus:outline-none focus:border-[#c5a059] transition-all placeholder:text-gray-400 font-light"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                    Create Password
                  </label>
                  <input
                    type="password"
                    placeholder="Create password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-white text-xs font-serif tracking-normal p-3 rounded focus:outline-none focus:border-[#c5a059] transition-all placeholder:text-gray-400 font-light"
                  />
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 font-semibold">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-800 text-white text-xs font-serif tracking-normal p-3 rounded focus:outline-none focus:border-[#c5a059] transition-all placeholder:text-gray-400 font-light"
                  />
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  className="px-8 mt-3 py-3 bg-[#c5a059] text-black hover:bg-[#d6b570] text-xs tracking-widest font-bold uppercase rounded transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(197,160,89,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Create Account
                </button>

                {/* SWITCH */}
                <div className="flex items-center justify-center mt-4 mb-10">
                  <span className="text-xs font-light text-gray-400">
                    Already have an account?
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="text-xs font-light ml-1 text-[#c5a059] hover:text-[#d6b570] transition-all cursor-pointer"
                  >
                    Login
                  </button>
                </div>

              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default Auth;
