import { useState } from "react";
import { motion } from "framer-motion";

export default function App() {
  const [page, setPage] = useState("login"); // login | register | dashboard | detect
  const [user, setUser] = useState(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerAge, setRegisterAge] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [language, setLanguage] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [confidence, setConfidence] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://localhost:5000";

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      setPage("dashboard");
    } catch (err) {
      console.error(err);
      alert(err.message || "Login failed");
    }
  };

  const handleRegister = async () => {
    if (!registerName || !registerEmail || !registerAge || !registerPassword) {
      alert("Please fill all registration fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          age: registerAge,
          password: registerPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Auto-login after successful registration
      const loginRes = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.error || "Auto-login failed");
      }

      setUser(loginData.user);
      setPage("dashboard");

      setRegisterName("");
      setRegisterEmail("");
      setRegisterAge("");
      setRegisterPassword("");

    } catch (err) {
      console.error(err);
      alert(err.message || "Registration failed");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPage("login");
    setLanguage("");
    setFile(null);
    setResult("");
    setConfidence("");
    setLoginEmail("");
    setLoginPassword("");
    setRegisterName("");
    setRegisterEmail("");
    setRegisterAge("");
    setRegisterPassword("");
  };

  const handleUpload = async () => {
    if (!language) {
      alert("Please select a language first");
      return;
    }

    if (!file) {
      alert("Please upload an audio file first");
      return;
    }

    if (!user?.id) {
      alert("User not logged in properly");
      return;
    }

    try {
      setLoading(true);
      setResult("");
      setConfidence("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);
      formData.append("user_id", user.id);

      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      console.log("Backend response:", data);

      setResult(data.prediction || "No result received");
      setConfidence(data.confidence || "");
    } catch (err) {
      console.error(err);
      alert(err.message || "Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  if (page === "login") {
    return (
      <div style={styles.pageCenter}>
        <motion.div
          style={styles.authCard}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h1 style={styles.title}>🧠 Dementia AI</h1>
          <p style={styles.subtitle}>Speech-based cognitive screening system</p>

          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            style={styles.inputBox}
          />

          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            style={styles.inputBox}
          />

          <button onClick={handleLogin} style={styles.button}>
            Login
          </button>

          <p style={styles.switchText}>
            Don&apos;t have an account?{" "}
            <span style={styles.linkText} onClick={() => setPage("register")}>
              Register here
            </span>
          </p>
        </motion.div>
      </div>
    );
  }

  if (page === "register") {
    return (
      <div style={styles.pageCenter}>
        <motion.div
          style={styles.authCard}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h1 style={styles.title}>🧠 Create Account</h1>
          <p style={styles.subtitle}>Register to continue to the dashboard</p>

          <input
            type="text"
            placeholder="Full Name"
            value={registerName}
            onChange={(e) => setRegisterName(e.target.value)}
            style={styles.inputBox}
          />

          <input
            type="email"
            placeholder="Email"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            style={styles.inputBox}
          />

          <input
            type="number"
            placeholder="Age"
            value={registerAge}
            onChange={(e) => setRegisterAge(e.target.value)}
            style={styles.inputBox}
          />

          <input
            type="password"
            placeholder="Password"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            style={styles.inputBox}
          />

          <button onClick={handleRegister} style={styles.button}>
            Register
          </button>

          <p style={styles.switchText}>
            Already have an account?{" "}
            <span style={styles.linkText} onClick={() => setPage("login")}>
              Login here
            </span>
          </p>
        </motion.div>
      </div>
    );
  }

  if (page === "dashboard") {
    return (
      <div style={styles.dashboard}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.header}>Dementia Detection Dashboard</h1>
            <p style={styles.userText}>
              Welcome, {user?.name || "User"}{" "}
              {user?.email ? `(${user.email})` : ""}
              {user?.age ? ` | Age: ${user.age}` : ""}
            </p>
          </div>

          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>

        <div style={styles.card}>
          <h3>Select Language</h3>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={styles.selectBox}
          >
            <option value="" style={{ color: "black" }}>
              -- Choose Language --
            </option>
            <option value="English" style={{ color: "black" }}>English</option>
            <option value="Hindi" style={{ color: "black" }}>Hindi</option>
            <option value="Bengali" style={{ color: "black" }}>Bengali</option>
            <option value="Tamil" style={{ color: "black" }}>Tamil</option>
            <option value="Telugu" style={{ color: "black" }}>Telugu</option>
          </select>

          {language && (
            <p style={styles.languageText}>Selected Language: {language}</p>
          )}
        </div>

        <div style={styles.card}>
          <h3>Actions</h3>

          <button
            onClick={() => {
              if (!language) {
                alert("Please select a language first");
                return;
              }
              setPage("detect");
            }}
            style={styles.button}
          >
            Check Dementia
          </button>
        </div>
      </div>
    );
  }

  if (page === "detect") {
    return (
      <div style={styles.dashboard}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.header}>Audio Analysis</h1>
            <p style={styles.userText}>
              User: {user?.name || "User"} | Age: {user?.age || "-"} | Language: {language}
            </p>
          </div>

          <button onClick={() => setPage("dashboard")} style={styles.logoutButton}>
            Back
          </button>
        </div>

        <div style={styles.card}>
          <h3>Upload Audio</h3>

          <input
            type="file"
            accept=".wav,audio/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.input}
          />

          {file && <p style={styles.fileText}>Selected File: {file.name}</p>}

          <button
            onClick={handleUpload}
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Audio"}
          </button>
        </div>

        {result && (
          <motion.div
            style={styles.result}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2>{result}</h2>
            <p>Confidence: {confidence}</p>
            <p>Language: {language}</p>
          </motion.div>
        )}
      </div>
    );
  }

  return null;
}

const styles = {
  pageCenter: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
    color: "white",
    fontFamily: "sans-serif",
    padding: "20px",
  },

  authCard: {
    width: "380px",
    maxWidth: "95%",
    padding: "36px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },

  dashboard: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
    padding: "40px 20px",
    color: "white",
    textAlign: "center",
    fontFamily: "sans-serif",
  },

  topBar: {
    maxWidth: "900px",
    margin: "0 auto 30px auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  header: {
    marginBottom: "8px",
    fontSize: "30px",
    color: "white",
  },

  title: {
    marginBottom: "10px",
    fontSize: "28px",
    whiteSpace: "nowrap",
    color: "white",
  },

  userText: {
    opacity: 0.85,
    fontSize: "14px",
    margin: 0,
  },

  card: {
    width: "380px",
    maxWidth: "95%",
    margin: "0 auto 22px auto",
    padding: "24px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    color: "white",
  },

  result: {
    marginTop: "20px",
    padding: "24px",
    display: "inline-block",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.1)",
    minWidth: "280px",
  },

  button: {
    marginTop: "16px",
    padding: "12px 18px",
    background: "#2563eb",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    fontSize: "15px",
  },

  logoutButton: {
    padding: "10px 16px",
    background: "#dc2626",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  input: {
    marginTop: "12px",
    color: "white",
    width: "100%",
  },

  inputBox: {
    width: "100%",
    padding: "12px",
    marginTop: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    outline: "none",
    background: "rgba(255,255,255,0.12)",
    color: "white",
    boxSizing: "border-box",
  },

  selectBox: {
    width: "100%",
    padding: "12px",
    marginTop: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.12)",
    color: "white",
    outline: "none",
  },

  subtitle: {
    fontSize: "14px",
    opacity: 0.85,
    marginBottom: "18px",
    color: "white",
  },

  switchText: {
    marginTop: "16px",
    fontSize: "14px",
    opacity: 0.9,
  },

  linkText: {
    color: "#93c5fd",
    cursor: "pointer",
    fontWeight: "bold",
  },

  languageText: {
    marginTop: "12px",
    fontSize: "14px",
    opacity: 0.9,
  },

  fileText: {
    marginTop: "12px",
    fontSize: "14px",
    opacity: 0.9,
    wordBreak: "break-word",
  },
};