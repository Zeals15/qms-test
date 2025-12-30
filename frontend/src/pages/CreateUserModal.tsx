//SRC/pages/CreateUserModal.tsx
import  { useEffect, useState } from "react";
import { api } from "../api";



const USERNAME_REGEX =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[@_])[A-Za-z0-9@_]{4,100}$/;

export default function CreateUserModal({
  open,
   user,   
  onClose,
  onCreated,
}: {
  open: boolean;
  user?: any;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
  username: "",
  name: "",
  email: "",
  phone: "",
  position: "",
  role: "sales",
  password: "",
});


  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
    // ✅ 2️⃣ useEffect GOES HERE (INSIDE COMPONENT)
  useEffect(() => {
    if (user) {
      // EDIT MODE
      setForm({
        username: user.username ?? "",
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        position: user.position ?? "",
        role: user.role ?? "sales",
        password: "",
      });
    } else {
      // CREATE MODE
      setForm({
        username: "",
        name: "",
        email: "",
        phone: "",
        position: "",
        role: "sales",
        password: "",
      });
    }
  }, [user, open]); 


  if (!open) return null;

  async function submit() {
  if (!form.email || (!user && !form.password)) {
    alert("Email and password are required");
    return;
  }

  if (form.username && !USERNAME_REGEX.test(form.username)) {
  alert("Username must contain 1 capital letter, 1 number, and @ or _");
  return;
}

  try {
    setSaving(true);

    if (user) {
      // ✅ EDIT MODE
    await api.updateUser(user.id, {
  username: form.username,
  name: form.name,
  email: form.email,
  phone: form.phone,
  position: form.position,
  role: form.role,
});



// 2️⃣ Update password ONLY if user entered one
if (form.password && form.password.trim().length > 0) {
  await api.updateUserPassword(user.id, form.password);

  // 🔐 FORCE LOGOUT IF USER CHANGED OWN PASSWORD
  const currentUserId = Number(localStorage.getItem("user_id"));
  if (currentUserId && user.id === currentUserId) {
    alert("Password updated. Please login again.");
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    window.location.href = "/login";
    return; // ⛔ stop execution
  }
}
    } else {
      // ✅ CREATE MODE
      await api.createUser({
  username: form.username,
  name: form.name,
  email: form.email,
  phone: form.phone,
  position: form.position,
  role: form.role,
  password: form.password,
});
    }

    onClose();
    onCreated();
  } catch (err) {
    alert(user ? "Failed to update user" : "Failed to create user");
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white w-full max-w-xl rounded-xl shadow-xl p-6">
        <h3 className="text-lg font-semibold mb-4">
  {user ? "Edit User" : "Create New User"}
</h3>

          <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Username"
            className="border px-3 py-2 rounded"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />

          <input
            placeholder="Full name"
            className="border px-3 py-2 rounded"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            placeholder="Email"
            className="border px-3 py-2 rounded"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            placeholder="Phone"
            className="border px-3 py-2 rounded"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <input
            placeholder="Position"
            className="border px-3 py-2 rounded"
            value={form.position}
            onChange={(e) =>
              setForm({ ...form, position: e.target.value })
            }
          />

          <select
            className="border px-3 py-2 rounded"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="sales">Sales</option>
            <option value="user">User</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>

         <div className="col-span-2 relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder={user ? "New Password (leave blank to keep current)" : "Password"}
    className="border px-3 py-2 rounded w-full pr-20"
    value={form.password}
    onChange={(e) =>
      setForm({ ...form, password: e.target.value })
    }
  />

  <button
    type="button"
    onClick={() => setShowPassword((v) => !v)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600"
  >
    {showPassword ? "Hide" : "Show"}
  </button>
</div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
  onClick={submit}
  disabled={saving}
  className="px-4 py-2 bg-blue-600 text-white rounded"
>
  {saving
    ? user ? "Updating…" : "Creating…"
    : user ? "Update User" : "Create User"}
</button>
        </div>
      </div>
    </div>
  );
}
