"use client";

import { useState, useEffect } from "react";
import { isBobbyAtGym, getCurrentSession, GymSession } from "@/utils/supabase";
import { FiClock } from "react-icons/fi";
import { format, parseISO } from "date-fns";

export default function Home() {
  const [bobbyPresent, setBobbyPresent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<GymSession | null>(null);

  useEffect(() => {
    async function checkBobbyStatus() {
      setLoading(true);
      const isPresent = await isBobbyAtGym();
      setBobbyPresent(isPresent);

      if (isPresent) {
        const session = await getCurrentSession();
        setCurrentSession(session);
      } else {
        setCurrentSession(null);
      }

      setLoading(false);
    }

    checkBobbyStatus();

    // Check status every minute
    const interval = setInterval(checkBobbyStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time in minutes if there's a current session
  const getRemainingTime = () => {
    if (!currentSession) return null;
    return Math.round(
      (new Date(currentSession.end_time).getTime() - new Date().getTime()) /
        (1000 * 60)
    );
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 bg-cover bg-center bg-fixed"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/bobby.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
        <div className="bg-black p-6 text-white">
          <h1 className="text-2xl font-bold text-center flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Bobby&apos;s Gym Status
          </h1>
          <div className="flex justify-center mt-2">
            <FiClock className="mr-2" size={20} />
            <p className="text-sm">Real-time updates</p>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-6 text-gray-800 font-medium">
                Checking Bobby&apos;s status...
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div
                className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center ${
                  bobbyPresent ? "bg-green-100" : "bg-red-100"
                } ${
                  bobbyPresent
                    ? "border-4 border-green-500"
                    : "border-4 border-red-500"
                }`}
              >
                <span
                  className={`text-5xl ${
                    bobbyPresent ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {bobbyPresent ? "✓" : "✗"}
                </span>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-800">
                {bobbyPresent
                  ? "Bobby is currently at the gym"
                  : "Bobby is not at the gym right now"}
              </h2>
              <p className="mt-2 text-gray-700">
                {bobbyPresent
                  ? "Feel free to stop by for a session!"
                  : "Check back later"}
              </p>

              {bobbyPresent && currentSession && (
                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-green-800 font-medium mb-2">
                    Current Session Details
                  </h3>
                  <div className="flex items-center justify-center text-sm text-green-700">
                    <div className="bg-green-100 px-3 py-1.5 rounded-lg flex items-center mr-4">
                      <span className="font-medium">Start:</span>
                      <span className="ml-1">
                        {format(parseISO(currentSession.start_time), "h:mm a")}
                      </span>
                    </div>
                    <div className="bg-green-100 px-3 py-1.5 rounded-lg flex items-center">
                      <span className="font-medium">End:</span>
                      <span className="ml-1">
                        {format(parseISO(currentSession.end_time), "h:mm a")}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs bg-green-200 text-green-800 py-1 px-3 rounded-full inline-block">
                    Session ends in {getRemainingTime()} minutes
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
