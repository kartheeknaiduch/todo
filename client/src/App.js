// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import ReactDatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import Login from "./Login";
// import Register from "./Register";

// function getTimeLeft(deadline) {
//   const now = new Date();
//   const end = new Date(deadline);
//   const diff = end - now;
//   if (diff <= 0) return 'Expired';
//   const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//   const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
//   const minutes = Math.floor((diff / (1000 * 60)) % 60);
//   const seconds = Math.floor((diff / 1000) % 60);
//   return `${days}d ${hours}h ${minutes}m ${seconds}s left`;
// }

// function getProgress(createdAt, deadline) {
//   const now = new Date();
//   const start = new Date(createdAt);
//   const end = new Date(deadline);
//   if (now >= end) return 100;
//   if (now <= start) return 0;
//   return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
// }

// function App() {
//   const [token, setToken] = useState(localStorage.getItem("token") || "");
//   const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "");
//   const [showRegister, setShowRegister] = useState(false);
//   const [title, setTitle] = useState("");
//   const [deadline, setDeadline] = useState("");
//   const [priority, setPriority] = useState("Medium");
//   const [todos, setTodos] = useState([]);
//   const [timers, setTimers] = useState({});
//   const [editId, setEditId] = useState(null);
//   const [editTitle, setEditTitle] = useState("");
//   const [editDeadline, setEditDeadline] = useState("");
//   const [editPriority, setEditPriority] = useState("Medium");
//   const [notificationEnabled, setNotificationEnabled] = useState(true);
//   const [reminderTime, setReminderTime] = useState(12);
//   const [showSettings, setShowSettings] = useState(false);
//   const [customMessage, setCustomMessage] = useState("");

//   useEffect(() => {
//     if (!token) return;
//     axios.get("http://localhost:5000/api/todos").then((res) => {
//       const sorted = res.data.sort((a, b) => {
//         const priorities = { High: 3, Medium: 2, Low: 1 };
//         return priorities[b.priority] - priorities[a.priority];
//       });
//       setTodos(sorted);
//     });
//   }, [token]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTimers(
//         todos.reduce((acc, todo) => {
//           acc[todo._id] = getTimeLeft(todo.deadline);
//           return acc;
//         }, {})
//       );
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [todos]);

//   useEffect(() => {
//     axios.defaults.headers.common["Authorization"] = token ? `Bearer ${token}` : "";
//   }, [token]);

//   const addTodo = () => {
//     if (!title.trim() || !deadline) return;

//     const newTodo = {
//       title,
//       deadline,
//       priority,
//       completed: false,
//     };

//     axios.post("http://localhost:5000/api/todos", newTodo).then((res) => {
//       setTodos((prev) =>
//         [...prev, res.data].sort((a, b) => {
//           const priorities = { High: 3, Medium: 2, Low: 1 };
//           return priorities[b.priority] - priorities[a.priority];
//         })
//       );
//       setTitle("");
//       setDeadline("");
//       setPriority("Medium");
//     });
//   };

//   const markCompleted = (id) => {
//     const todo = todos.find(todo => todo._id === id);
//     const newCompletedStatus = !todo.completed;
//     axios.put(`http://localhost:5000/api/todos/${id}`, { completed: newCompletedStatus }).then(() => {
//       setTodos((prev) =>
//         prev.map((todo) =>
//           todo._id === id ? { ...todo, completed: newCompletedStatus } : todo
//         )
//       );
//     });
//   };

//   const deleteTodo = (id) => {
//     axios.delete(`http://localhost:5000/api/todos/${id}`).then(() => {
//       setTodos((prev) => prev.filter((todo) => todo._id !== id));
//     });
//   };

//   const startEdit = (todo) => {
//     setEditId(todo._id);
//     setEditTitle(todo.title);
//     setEditDeadline(todo.deadline);
//     setEditPriority(todo.priority);
//   };

//   const cancelEdit = () => {
//     setEditId(null);
//     setEditTitle("");
//     setEditDeadline("");
//     setEditPriority("Medium");
//   };

//   const saveEdit = (id) => {
//     axios.put(`http://localhost:5000/api/todos/${id}`, {
//       title: editTitle,
//       deadline: editDeadline,
//       priority: editPriority,
//     }).then((res) => {
//       setTodos((prev) => prev.map((todo) => todo._id === id ? { ...todo, ...res.data } : todo));
//       cancelEdit();
//     });
//   };

//   const saveEmailSettings = async () => {
//     try {
//       await axios.post("http://localhost:5000/api/users", {
//         email: userEmail,
//         notificationPreferences: {
//           enabled: notificationEnabled,
//           reminderTime,
//           customMessage
//         }
//       });
//       alert("Email settings saved successfully!");
//       setShowSettings(false);
//     } catch (error) {
//       console.error("Error saving email settings:", error);
//       alert("Failed to save email settings");
//     }
//   };

//   const handleLogin = (jwt, email) => {
//     setToken(jwt);
//     setUserEmail(email);
//     localStorage.setItem("token", jwt);
//     localStorage.setItem("userEmail", email);
//   };

//   const handleLogout = () => {
//     setToken("");
//     setUserEmail("");
//     localStorage.removeItem("token");
//     localStorage.removeItem("userEmail");
//   };

//   const handleSwitchToRegister = () => setShowRegister(true);
//   const handleSwitchToLogin = () => setShowRegister(false);

//   if (!token) {
//     return showRegister ? (
//       <Register onRegister={handleSwitchToLogin} switchToLogin={handleSwitchToLogin} />
//     ) : (
//       <Login onLogin={handleLogin} switchToRegister={handleSwitchToRegister} />
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#1f1f3a] to-[#2a235d] text-white p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-4xl font-bold">📋 To-Do List</h1>
//         <div>
//           <button
//             onClick={handleLogout}
//             className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded mr-2"
//           >
//             Logout
//           </button>
//           <button
//             onClick={() => setShowSettings(!showSettings)}
//             className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded"
//           >
//             ⚙️ Settings
//           </button>
//         </div>
//       </div>

//       {showSettings && (
//         <div className="bg-[#23233a] p-6 rounded-lg mb-8">
//           <h2 className="text-2xl font-semibold mb-4">Notification Settings</h2>
//           <div className="space-y-4">
//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 id="notifications"
//                 checked={notificationEnabled}
//                 onChange={(e) => setNotificationEnabled(e.target.checked)}
//                 className="w-4 h-4"
//               />
//               <label htmlFor="notifications">Enable email notifications</label>
//             </div>
//             <div>
//               <label className="block mb-2">Reminder Time (hours before deadline)</label>
//               <input
//                 type="number"
//                 value={reminderTime}
//                 onChange={(e) => setReminderTime(Number(e.target.value))}
//                 min="1"
//                 max="24"
//                 className="w-full p-2 rounded bg-[#2f2f4f] text-white"
//               />
//             </div>
//             <div>
//               <label className="block mb-2">Custom Message for Email</label>
//               <textarea
//                 value={customMessage}
//                 onChange={e => setCustomMessage(e.target.value)}
//                 className="w-full p-2 rounded bg-[#2f2f4f] text-white"
//                 placeholder="Enter your custom message for notifications"
//               />
//             </div>
//             <button
//               onClick={saveEmailSettings}
//               className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
//             >
//               Save Settings
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="flex gap-4 mb-8 flex-wrap">
//         <input
//           type="text"
//           placeholder="Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           className="p-2 rounded bg-[#2f2f4f] text-white"
//         />
//         <ReactDatePicker
//           selected={deadline ? new Date(deadline) : null}
//           onChange={date => setDeadline(date ? date.toISOString() : "")}
//           showTimeSelect
//           dateFormat="Pp"
//           className="p-2 rounded bg-[#2f2f4f] text-white"
//           placeholderText="Select deadline"
//         />
//         <select
//           value={priority}
//           onChange={(e) => setPriority(e.target.value)}
//           className="p-2 rounded bg-[#2f2f4f] text-white"
//         >
//           <option>High</option>
//           <option>Medium</option>
//           <option>Low</option>
//         </select>
//         <button
//           onClick={addTodo}
//           className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
//         >
//           Add
//         </button>
//       </div>

//       {/* Incomplete Tasks Section */}
//       <h2 className="text-2xl font-semibold mb-2">Incomplete Tasks</h2>
//       <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
//         {todos.filter(todo => !todo.completed).map((todo) => (
//           <div
//             key={todo._id}
//             className={`p-4 rounded-lg shadow-md border-2 transition-all duration-300 bg-[#23233a] flex flex-col w-full mb-4
//               ${new Date(todo.deadline) - new Date() < 12 * 60 * 60 * 1000 && new Date(todo.deadline) - new Date() > 0 ? 'border-red-400 shadow-red-400/40' : 'border-yellow-400 shadow-yellow-400/40'}
//             `}
//           >
//             <div className="flex items-center justify-between mb-2">
//               {editId === todo._id ? (
//                 <input
//                   className="text-xl font-semibold truncate flex-1 p-1 rounded bg-[#2f2f4f] text-white"
//                   value={editTitle}
//                   onChange={e => setEditTitle(e.target.value)}
//                 />
//               ) : (
//                 <h2 className="text-xl font-semibold truncate flex-1">{todo.title}</h2>
//               )}
//               <button
//                 onClick={() => markCompleted(todo._id)}
//                 className={`ml-2 w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${todo.completed ? "bg-green-500" : "bg-gray-400"}`}
//                 style={{ minWidth: "48px" }}
//                 title={todo.completed ? 'Mark as Pending' : 'Mark as Completed'}
//               >
//                 <div
//                   className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${todo.completed ? "translate-x-6" : ""}`}
//                 ></div>
//               </button>
//               <button
//                 onClick={() => { if (!todo.completed) startEdit(todo); }}
//                 className={`ml-2 bg-yellow-500 px-3 py-1 rounded text-sm hover:bg-yellow-600 ${todo.completed ? 'opacity-50 cursor-not-allowed' : ''}`}
//                 title="Edit"
//                 disabled={editId === todo._id || todo.completed}
//               >
//                 ✏️
//               </button>
//               <button
//                 onClick={() => deleteTodo(todo._id)}
//                 className="ml-2 bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"
//                 title="Remove"
//               >
//                 ✖
//               </button>
//             </div>
//             <div className="flex flex-col gap-1 mt-2">
//               <div className="flex items-center gap-2">
//                 <span className="text-sm">📅 Deadline:</span>
//                 {editId === todo._id ? (
//                   <ReactDatePicker
//                     selected={editDeadline ? new Date(editDeadline) : null}
//                     onChange={date => setEditDeadline(date ? date.toISOString() : "")}
//                     showTimeSelect
//                     dateFormat="Pp"
//                     className="p-1 rounded bg-[#2f2f4f] text-white"
//                     placeholderText="Select deadline"
//                   />
//                 ) : (
//                   <span className="text-sm">{new Date(todo.deadline).toLocaleDateString()}</span>
//                 )}
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="text-sm">🏷️ Priority:</span>
//                 {editId === todo._id ? (
//                   <select
//                     value={editPriority}
//                     onChange={e => setEditPriority(e.target.value)}
//                     className="p-1 rounded bg-[#2f2f4f] text-white"
//                   >
//                     <option>High</option>
//                     <option>Medium</option>
//                     <option>Low</option>
//                   </select>
//                 ) : (
//                   <span className="text-sm text-yellow-300 font-medium">{todo.priority}</span>
//                 )}
//               </div>
//               {!todo.completed && (
//                 <div className="flex items-center gap-2">
//                   <span className="text-lg">⏰</span>
//                   <span className={`text-base
//                     ${new Date(todo.deadline) - new Date() < 12 * 60 * 60 * 1000 && new Date(todo.deadline) - new Date() > 0 ? 'text-red-400'
//                       : 'text-yellow-300'}
//                   `}>{timers[todo._id] || getTimeLeft(todo.deadline)}</span>
//                 </div>
//               )}
//               {!todo.completed && (
//                 <div className="w-full h-2 bg-gray-700 rounded mt-1">
//                   <div
//                     className="h-2 rounded bg-blue-400 transition-all duration-500"
//                     style={{ width: `${getProgress(todo.createdAt, todo.deadline)}%` }}
//                   ></div>
//                 </div>
//               )}
//               <div className="flex items-center gap-2 mt-2">
//                 <span className="text-sm">Status:</span>
//                 <span className={`text-sm font-semibold ${todo.completed ? 'text-green-400' : 'text-gray-400'}`}>{todo.completed ? 'Completed' : 'Pending'}</span>
//               </div>
//               {editId === todo._id && (
//                 <div className="flex gap-2 mt-2">
//                   <button
//                     onClick={() => saveEdit(todo._id)}
//                     className="bg-green-500 px-3 py-1 rounded text-sm hover:bg-green-600"
//                   >
//                     Save
//                   </button>
//                   <button
//                     onClick={cancelEdit}
//                     className="bg-gray-500 px-3 py-1 rounded text-sm hover:bg-gray-600"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Completed Tasks Section */}
//       <h2 className="text-2xl font-semibold mb-2">Completed Tasks</h2>
//       <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//         {todos.filter(todo => todo.completed).map((todo) => (
//           <div
//             key={todo._id}
//             className={`p-4 rounded-lg shadow-md border-2 transition-all duration-300 bg-[#23233a] flex flex-col w-full mb-4 border-green-400 shadow-green-400/40 opacity-50`}
//           >
//             <div className="flex items-center justify-between mb-2">
//               <h2 className="text-xl font-semibold flex-1 break-words whitespace-pre-line">{todo.title}</h2>
//               <button
//                 onClick={() => markCompleted(todo._id)}
//                 className={`ml-2 w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${todo.completed ? "bg-green-500" : "bg-gray-400"}`}
//                 style={{ minWidth: "48px" }}
//                 title={todo.completed ? 'Mark as Pending' : 'Mark as Completed'}
//               >
//                 <div
//                   className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${todo.completed ? "translate-x-6" : ""}`}
//                 ></div>
//               </button>
//               <button
//                 onClick={() => deleteTodo(todo._id)}
//                 className="ml-2 bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"
//                 title="Remove"
//               >
//                 ✖
//               </button>
//             </div>
//             <div className="flex flex-col gap-1 mt-2">
//               <div className="flex items-center gap-2">
//                 <span className="text-sm">📅 Deadline:</span>
//                 <span className="text-sm">{new Date(todo.deadline).toLocaleDateString()}</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="text-sm">🏷️ Priority:</span>
//                 <span className="text-sm text-yellow-300 font-medium">{todo.priority}</span>
//               </div>
//               <div className="flex items-center gap-2 mt-2">
//                 <span className="text-sm">Status:</span>
//                 <span className="text-sm font-semibold text-green-400">Completed</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default App;

// App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Login from "./Login";
import Register from "./Register";
import config from "./config";

function getTimeLeft(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return `${days}d ${hours}h ${minutes}m ${seconds}s left`;
}

function getProgress(createdAt, deadline) {
  const now = new Date();
  const start = new Date(createdAt);
  const end = new Date(deadline);
  if (now >= end) return 100;
  if (now <= start) return 0;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "");
  const [showRegister, setShowRegister] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [todos, setTodos] = useState([]);
  const [timers, setTimers] = useState({});
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState(12);
  const [showSettings, setShowSettings] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    axios.get(`${config.apiUrl}/api/todos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      const sorted = res.data.sort((a, b) => {
        const priorities = { High: 3, Medium: 2, Low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });
      setTodos(sorted);
    }).catch((err) => {
      console.error("Failed to fetch todos:", err);
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        handleLogout();
      }
    });
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(
        todos.reduce((acc, todo) => {
          acc[todo._id] = getTimeLeft(todo.deadline);
          return acc;
        }, {})
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [todos]);

  const addTodo = () => {
    if (!title.trim() || !deadline) return;
    const newTodo = {
      title,
      deadline,
      priority,
      completed: false,
    };
    axios.post(`${config.apiUrl}/api/todos`, newTodo, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      setTodos((prev) =>
        [...prev, res.data].sort((a, b) => {
          const priorities = { High: 3, Medium: 2, Low: 1 };
          return priorities[b.priority] - priorities[a.priority];
        })
      );
      setTitle("");
      setDeadline("");
      setPriority("Medium");
    });
  };

  const markCompleted = (id) => {
    const todo = todos.find(todo => todo._id === id);
    const newCompletedStatus = !todo.completed;
    axios.put(`${config.apiUrl}/api/todos/${id}`, { completed: newCompletedStatus }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(() => {
      setTodos((prev) =>
        prev.map((todo) =>
          todo._id === id ? { ...todo, completed: newCompletedStatus } : todo
        )
      );
    });
  };

  const deleteTodo = (id) => {
    axios.delete(`${config.apiUrl}/api/todos/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(() => {
      setTodos((prev) => prev.filter((todo) => todo._id !== id));
    });
  };

  const saveEdit = (id) => {
    axios.put(`${config.apiUrl}/api/todos/${id}`, {
      title: editTitle,
      deadline: editDeadline,
      priority: editPriority,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      setTodos((prev) => prev.map((todo) => todo._id === id ? { ...todo, ...res.data } : todo));
      cancelEdit();
    });
  };

  const saveEmailSettings = async () => {
    try {
      await axios.post(`${config.apiUrl}/api/users`, {
        email: userEmail,
        notificationPreferences: {
          enabled: notificationEnabled,
          reminderTime,
          customMessage,
        },
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Email settings saved successfully!");
      setShowSettings(false);
    } catch (error) {
      console.error("Error saving email settings:", error);
      alert("Failed to save email settings");
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const { notificationPreferences } = response.data;
      if (notificationPreferences) {
        setNotificationEnabled(notificationPreferences.enabled ?? true);
        setReminderTime(notificationPreferences.reminderTime ?? 12);
        setCustomMessage(notificationPreferences.customMessage ?? '');
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
      // Set default values if loading fails
      setNotificationEnabled(true);
      setReminderTime(12);
      setCustomMessage('');
    }
  };

  const toggleSettings = async () => {
    if (!showSettings) {
      // Load preferences when opening settings
      await loadUserPreferences();
    }
    setShowSettings(!showSettings);
  };

  const startEdit = (todo) => {
    setEditId(todo._id);
    setEditTitle(todo.title);
    setEditDeadline(todo.deadline);
    setEditPriority(todo.priority);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditDeadline("");
    setEditPriority("Medium");
  };

  const handleLogin = (jwt, email) => {
    setToken(jwt);
    setUserEmail(email);
    localStorage.setItem("token", jwt);
    localStorage.setItem("userEmail", email);
  };

  const handleLogout = () => {
    setToken("");
    setUserEmail("");
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  };

  const handleSwitchToRegister = () => setShowRegister(true);
  const handleSwitchToLogin = () => setShowRegister(false);

  if (!token) {
    return showRegister ? (
      <Register onRegister={handleSwitchToLogin} switchToLogin={handleSwitchToLogin} />
    ) : (
      <Login onLogin={handleLogin} switchToRegister={handleSwitchToRegister} />
    );
  }

   return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f1f3a] to-[#2a235d] text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">📋 To-Do List</h1>
        <div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded mr-2"
          >
            Logout
          </button>
          <button
            onClick={toggleSettings}
            className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-[#23233a] p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifications"
                checked={notificationEnabled}
                onChange={(e) => setNotificationEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="notifications">Enable email notifications</label>
            </div>
            <div>
              <label className="block mb-2">Reminder Time (hours before deadline)</label>
              <input
                type="number"
                value={reminderTime}
                onChange={(e) => setReminderTime(Number(e.target.value))}
                min="1"
                max="24"
                className="w-full p-2 rounded bg-[#2f2f4f] text-white"
              />
            </div>
            <div>
              <label className="block mb-2">Custom Message for Email</label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                className="w-full p-2 rounded bg-[#2f2f4f] text-white"
                placeholder="Enter your custom message for notifications"
              />
            </div>
            <button
              onClick={saveEmailSettings}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-8 flex-wrap">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 rounded bg-[#2f2f4f] text-white"
        />
        <ReactDatePicker
          selected={deadline ? new Date(deadline) : null}
          onChange={date => setDeadline(date ? date.toISOString() : "")}
          showTimeSelect
          dateFormat="Pp"
          className="p-2 rounded bg-[#2f2f4f] text-white"
          placeholderText="Select deadline"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="p-2 rounded bg-[#2f2f4f] text-white"
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <button
          onClick={addTodo}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* Incomplete Tasks Section */}
      <h2 className="text-2xl font-semibold mb-2">Incomplete Tasks</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
        {todos.filter(todo => !todo.completed).map((todo) => (
          <div
            key={todo._id}
            className={`p-4 rounded-lg shadow-md border-2 transition-all duration-300 bg-[#23233a] flex flex-col w-full mb-4
              ${new Date(todo.deadline) - new Date() < 12 * 60 * 60 * 1000 && new Date(todo.deadline) - new Date() > 0 ? 'border-red-400 shadow-red-400/40' : 'border-yellow-400 shadow-yellow-400/40'}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              {editId === todo._id ? (
                <input
                  className="text-xl font-semibold truncate flex-1 p-1 rounded bg-[#2f2f4f] text-white"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
              ) : (
                <h2 className="text-xl font-semibold truncate flex-1">{todo.title}</h2>
              )}
              <button
                onClick={() => markCompleted(todo._id)}
                className={`ml-2 w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${todo.completed ? "bg-green-500" : "bg-gray-400"}`}
                style={{ minWidth: "48px" }}
                title={todo.completed ? 'Mark as Pending' : 'Mark as Completed'}
              >
                <div
                  className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${todo.completed ? "translate-x-6" : ""}`}
                ></div>
              </button>
              <button
                onClick={() => { if (!todo.completed) startEdit(todo); }}
                className={`ml-2 bg-yellow-500 px-3 py-1 rounded text-sm hover:bg-yellow-600 ${todo.completed ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Edit"
                disabled={editId === todo._id || todo.completed}
              >
                ✏️
              </button>
              <button
                onClick={() => deleteTodo(todo._id)}
                className="ml-2 bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"
                title="Remove"
              >
                ✖
              </button>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📅 Deadline:</span>
                {editId === todo._id ? (
                  <ReactDatePicker
                    selected={editDeadline ? new Date(editDeadline) : null}
                    onChange={date => setEditDeadline(date ? date.toISOString() : "")}
                    showTimeSelect
                    dateFormat="Pp"
                    className="p-1 rounded bg-[#2f2f4f] text-white"
                    placeholderText="Select deadline"
                  />
                ) : (
                  <span className="text-sm">{new Date(todo.deadline).toLocaleDateString()}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🏷️ Priority:</span>
                {editId === todo._id ? (
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value)}
                    className="p-1 rounded bg-[#2f2f4f] text-white"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                ) : (
                  <span className="text-sm text-yellow-300 font-medium">{todo.priority}</span>
                )}
              </div>
              {!todo.completed && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏰</span>
                  <span className={`text-base
                    ${new Date(todo.deadline) - new Date() < 12 * 60 * 60 * 1000 && new Date(todo.deadline) - new Date() > 0 ? 'text-red-400'
                      : 'text-yellow-300'}
                  `}>{timers[todo._id] || getTimeLeft(todo.deadline)}</span>
                </div>
              )}
              {!todo.completed && (
                <div className="w-full h-2 bg-gray-700 rounded mt-1">
                  <div
                    className="h-2 rounded bg-blue-400 transition-all duration-500"
                    style={{ width: `${getProgress(todo.createdAt, todo.deadline)}%` }}
                  ></div>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">Status:</span>
                <span className={`text-sm font-semibold ${todo.completed ? 'text-green-400' : 'text-gray-400'}`}>{todo.completed ? 'Completed' : 'Pending'}</span>
              </div>
              {editId === todo._id && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => saveEdit(todo._id)}
                    className="bg-green-500 px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-500 px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completed Tasks Section */}
      <h2 className="text-2xl font-semibold mb-2">Completed Tasks</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {todos.filter(todo => todo.completed).map((todo) => (
          <div
            key={todo._id}
            className={`p-4 rounded-lg shadow-md border-2 transition-all duration-300 bg-[#23233a] flex flex-col w-full mb-4 border-green-400 shadow-green-400/40 opacity-50`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold flex-1 break-words whitespace-pre-line">{todo.title}</h2>
              <button
                onClick={() => markCompleted(todo._id)}
                className={`ml-2 w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${todo.completed ? "bg-green-500" : "bg-gray-400"}`}
                style={{ minWidth: "48px" }}
                title={todo.completed ? 'Mark as Pending' : 'Mark as Completed'}
              >
                <div
                  className={`bg-black w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${todo.completed ? "translate-x-6" : ""}`}
                ></div>
              </button>
              <button
                onClick={() => deleteTodo(todo._id)}
                className="ml-2 bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"
                title="Remove"
              >
                ✖
              </button>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📅 Deadline:</span>
                <span className="text-sm">{new Date(todo.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🏷️ Priority:</span>
                <span className="text-sm text-yellow-300 font-medium">{todo.priority}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">Status:</span>
                <span className="text-sm font-semibold text-green-400">Completed</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
