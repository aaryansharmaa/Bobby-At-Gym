"use client";

import { useState, useEffect } from "react";
import {
  isBobbyAtGym,
  getCurrentSession,
  getFutureSessions,
  GymSession,
  getDangerStatus,
} from "@/utils/supabase";
import { FiClock, FiAlertTriangle, FiCalendar } from "react-icons/fi";
import { format, parseISO } from "date-fns";

export default function Home() {
  const [bobbyPresent, setBobbyPresent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<GymSession | null>(null);
  const [futureSessions, setFutureSessions] = useState<GymSession[]>([]);
  const [isDanger, setIsDanger] = useState<boolean>(false);

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

      // Get future sessions
      const futureSessionsData = await getFutureSessions();
      setFutureSessions(futureSessionsData);

      // Also check danger status
      const dangerStatus = await getDangerStatus();
      setIsDanger(dangerStatus);

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
        {isDanger && (
          <div className="bg-red-600 text-white p-3 flex items-center justify-center animate-pulse">
            <FiAlertTriangle className="mr-2" size={20} />
            <span className="font-bold">DANGER MODE ACTIVE</span>
          </div>
        )}

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
                } ${
                  isDanger
                    ? "ring-4 ring-red-500 ring-offset-4 ring-offset-white/90"
                    : ""
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

              {isDanger && (
                <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center text-red-800 font-bold mb-2">
                    <FiAlertTriangle className="mr-2" />
                    <h3>Danger Alert</h3>
                  </div>
                  <p className="text-red-700 text-sm">
                    A safety concern has been reported at the gym. Please
                    exercise caution.
                  </p>
                </div>
              )}

              {!isDanger && (
                <div className="mt-6 bg-blue-50 p-2 rounded-lg border border-blue-200">
                  <div className="flex items-center text-blue-800 font-bold ">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3>Safe Environment</h3>
                  </div>
                </div>
              )}

              {futureSessions.length > 0 && (
                <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center text-purple-800 font-bold mb-2">
                    <FiCalendar className="mr-2" />
                    <h3>Upcoming Today</h3>
                  </div>
                  <div className="space-y-2">
                    {futureSessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-white p-3 rounded-md shadow-sm"
                      >
                        <div className="flex items-center text-sm text-purple-700">
                          <div className="bg-purple-100 px-3 py-1.5 rounded-lg flex items-center mr-4">
                            <span className="font-medium">Start:</span>
                            <span className="ml-1">
                              {format(parseISO(session.start_time), "h:mm a")}
                            </span>
                          </div>
                          <div className="bg-purple-100 px-3 py-1.5 rounded-lg flex items-center">
                            <span className="font-medium">End:</span>
                            <span className="ml-1">
                              {format(parseISO(session.end_time), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
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
