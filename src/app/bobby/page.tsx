"use client";

import { useState, useEffect } from "react";
import {
  supabase,
  GymSession,
  getBobbyGymSessions,
  addGymSession,
  deleteGymSession,
  isBobbyAtGym,
  getCurrentSession,
} from "@/utils/supabase";
import { format, parseISO } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiTrash2, FiLogOut, FiPlus, FiX } from "react-icons/fi";
import { Session, User } from "@supabase/supabase-js";

export default function BobbyPage() {
  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isCurrentlyAtGym, setIsCurrentlyAtGym] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState<GymSession | null>(null);

  // For adding new sessions
  const [isAdding, setIsAdding] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For login
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    // Check if Bobby is currently at the gym and get current session details
    const checkCurrentStatus = async () => {
      const atGym = await isBobbyAtGym();
      setIsCurrentlyAtGym(atGym);

      if (atGym) {
        const session = await getCurrentSession();
        setCurrentSession(session);
      } else {
        setCurrentSession(null);
      }
    };

    // Initial check
    checkCurrentStatus();

    // Check every minute
    const statusInterval = setInterval(checkCurrentStatus, 60000);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    // Check auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchGymSessions();
        } else {
          setSessions([]);
        }
      }
    );

    // Initial auth check
    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        setUser(session?.user || null);
        if (session?.user) {
          fetchGymSessions();
        } else {
          setLoading(false);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchGymSessions() {
    setLoading(true);
    const data = await getBobbyGymSessions();
    setSessions(data);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleAddSession() {
    if (!startTime || !endTime) {
      setError("Please select both start and end times");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time");
      return;
    }

    if (!user) {
      setError("You must be logged in to add sessions");
      return;
    }

    setError(null);
    const success = await addGymSession(startTime, endTime, user.id);

    if (success) {
      setIsAdding(false);
      setStartTime(null);
      setEndTime(null);
      fetchGymSessions();
    }
  }

  async function handleDeleteSession(id: string) {
    if (confirm("Are you sure you want to delete this session?")) {
      const success = await deleteGymSession(id);
      if (success) {
        fetchGymSessions();
      }
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during login";
      setError(errorMessage);
    }
  }

  // Add keyboard support for form submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-black p-6 text-white flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Bobby&apos;s Gym Schedule
          </h1>

          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center text-sm bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-full transition-colors font-medium shadow-sm"
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
          )}
        </div>

        {user && isCurrentlyAtGym && currentSession && (
          <div className="bg-green-100 border-l-4 border-green-500 p-4">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-green-800 font-medium">
                  You are currently in an ongoing gym session!
                </p>
                {currentSession && (
                  <p className="text-green-700 text-sm mt-1">
                    Session time:{" "}
                    {format(parseISO(currentSession.start_time), "h:mm a")} -{" "}
                    {format(parseISO(currentSession.end_time), "h:mm a")}
                    <span className="ml-2 bg-green-200 text-green-800 text-xs py-1 px-2 rounded-full">
                      Ends in{" "}
                      {Math.round(
                        (new Date(currentSession.end_time).getTime() -
                          new Date().getTime()) /
                          (1000 * 60)
                      )}{" "}
                      minutes
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-6">
          {!user ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-6">Login as Bobby</h3>

              <div className="max-w-sm mx-auto">
                <div className="mb-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-3 py-2 border rounded-md"
                    autoComplete="email"
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div className="mb-4">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-2 border rounded-md"
                    autoComplete="current-password"
                    onKeyDown={handleKeyDown}
                  />
                </div>

                {error && (
                  <div className="mb-4 text-red-500 text-sm">{error}</div>
                )}

                <button
                  onClick={handleLogin}
                  className="w-full bg-black hover:bg-gray-800 text-white py-3 px-6 rounded-lg transition-colors shadow-md font-medium text-lg flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h14a1 1 0 001-1V4a1 1 0 00-1-1H3zm5.707 8.707a1 1 0 01-1.414 0L6 10.414V12a1 1 0 11-2 0V8a1 1 0 011-1h4a1 1 0 110 2H7.414l1.293 1.293a1 1 0 010 1.414zM16 6a1 1 0 00-1-1h-4a1 1 0 100 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L15 8.414V10a1 1 0 102 0V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Login to Manage Schedule
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-black"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Your Scheduled Sessions
                </h2>

                {!isAdding ? (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center bg-black hover:bg-gray-800 text-white py-2 px-6 rounded-full transition-all transform hover:-translate-y-1 hover:shadow-md"
                  >
                    <FiPlus className="mr-2" />
                    Add Session
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setError(null);
                    }}
                    className="flex items-center bg-gray-800 hover:bg-gray-900 text-white py-2 px-6 rounded-full transition-all transform hover:-translate-y-1 hover:shadow-md"
                  >
                    <FiX className="mr-2" />
                    Cancel
                  </button>
                )}
              </div>

              {isAdding && (
                <div className="mb-6 p-6 border-2 border-black rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-md">
                  <h3 className="text-xl font-medium mb-4 text-gray-800 flex items-center">
                    <span className="bg-black text-white p-1 rounded-full w-7 h-7 inline-flex items-center justify-center mr-2">
                      <FiPlus size={18} />
                    </span>
                    Add New Session
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <div className="">
                        <DatePicker
                          selected={startTime}
                          onChange={setStartTime}
                          showTimeSelect
                          dateFormat="MMMM d, yyyy h:mm aa"
                          className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:ring-1 focus:ring-black rounded-md shadow-sm"
                          placeholderText="Select start time"
                        />
                        <div className="absolute right-3 top-3 text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <div className="">
                        <DatePicker
                          selected={endTime}
                          onChange={setEndTime}
                          showTimeSelect
                          dateFormat="MMMM d, yyyy h:mm aa"
                          className="w-full px-4 py-3 border-2 border-gray-300 focus:border-black focus:ring-1 focus:ring-black rounded-md shadow-sm"
                          placeholderText="Select end time"
                        />
                        <div className="absolute right-3 top-3 text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                      <div className="flex">
                        <svg
                          className="h-5 w-5 text-red-500 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {error}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleAddSession}
                      className="bg-black hover:bg-gray-800 text-white py-3 px-10 rounded-full transition-all hover:shadow-lg transform hover:-translate-y-1 font-medium text-lg flex items-center justify-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z" />
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Save Gym Session
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-6 text-gray-600 font-medium">
                    Loading your sessions...
                  </p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-10 px-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-black"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg mb-4">
                    You haven&apos;t scheduled any gym sessions yet.
                  </p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="mt-2 px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex items-center mx-auto"
                  >
                    <FiPlus className="mr-2" />
                    Schedule your first session
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const startDate = parseISO(session.start_time);
                    const endDate = parseISO(session.end_time);
                    const isToday =
                      new Date().toDateString() === startDate.toDateString();
                    const isActive =
                      new Date() >= startDate && new Date() <= endDate;

                    return (
                      <div
                        key={session.id}
                        className={`border rounded-lg overflow-hidden shadow-sm ${
                          isToday
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200"
                        } ${isActive ? "ring-2 ring-green-500" : ""}`}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                                  isToday
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {format(startDate, "d")}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {format(startDate, "MMMM d, yyyy")}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {isToday
                                    ? "Today"
                                    : format(startDate, "EEEE")}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-white hover:text-red-50 bg-black hover:bg-gray-800 p-2 rounded-full transition-colors"
                              title="Delete session"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-3">
                            <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
                              <span className="text-xs text-gray-500">
                                Start
                              </span>
                              <div className="text-sm font-medium">
                                {format(startDate, "h:mm a")}
                              </div>
                            </div>
                            <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
                              <span className="text-xs text-gray-500">End</span>
                              <div className="text-sm font-medium">
                                {format(endDate, "h:mm a")}
                              </div>
                            </div>
                            <div className="bg-gray-100 px-3 py-1.5 rounded-lg ml-auto">
                              <span className="text-xs text-gray-500">
                                Duration
                              </span>
                              <div className="text-sm font-medium">
                                {Math.round(
                                  (endDate.getTime() - startDate.getTime()) /
                                    (1000 * 60)
                                )}{" "}
                                min
                              </div>
                            </div>
                          </div>

                          {isActive && (
                            <div className="mt-3 bg-green-100 text-green-800 text-xs py-1 px-3 rounded-full inline-block">
                              Currently active
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
