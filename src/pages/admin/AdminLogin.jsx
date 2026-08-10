function AdminLogin() {
  return (
    <div>
      <h1>Admin Login</h1>

      <form>
        <div>
          <label>Username</label>
          <input type="text" placeholder="Enter username" />
        </div>

        <div>
          <label>Password</label>
          <input type="password" placeholder="Enter password" />
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default AdminLogin;