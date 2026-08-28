const ADMIN_TOKEN_KEY =
  "pbz_admin_token";

const ADMIN_USER_KEY =
  "pbz_admin_user";


export const getAdminToken = () => {
  return (
    localStorage.getItem(
      ADMIN_TOKEN_KEY
    ) ||
    sessionStorage.getItem(
      ADMIN_TOKEN_KEY
    )
  );
};


export const getAdminUser = () => {
  const storedUser =
    localStorage.getItem(
      ADMIN_USER_KEY
    ) ||
    sessionStorage.getItem(
      ADMIN_USER_KEY
    );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser
    );
  } catch {
    return null;
  }
};


export const isAdminAuthenticated =
  () => {
    const token =
      getAdminToken();

    const user =
      getAdminUser();

    if (!token || !user) {
      return false;
    }

    return (
      user.is_staff === true ||
      user.is_superuser === true
    );
  };


export const saveAdminSession = (
  token,
  user,
  rememberMe = false
) => {
  clearAdminSession();

  const storage =
    rememberMe
      ? localStorage
      : sessionStorage;

  storage.setItem(
    ADMIN_TOKEN_KEY,
    token
  );

  storage.setItem(
    ADMIN_USER_KEY,
    JSON.stringify(user)
  );
};


export const clearAdminSession =
  () => {
    localStorage.removeItem(
      ADMIN_TOKEN_KEY
    );

    localStorage.removeItem(
      ADMIN_USER_KEY
    );

    sessionStorage.removeItem(
      ADMIN_TOKEN_KEY
    );

    sessionStorage.removeItem(
      ADMIN_USER_KEY
    );
  };