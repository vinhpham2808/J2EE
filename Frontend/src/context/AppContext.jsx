import { createContext, useState } from "react";

export const AppContext = createContext({
  user: null,
  setUser: () => {},
  clearUser: () => {},
  currentPage: null,
  setCurrentPage: () => {}
});

export const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);

  const clearUser = () => {
    setUser(null);
    localStorage.setItem("logout-event", Date.now().toString());
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        clearUser,
        currentPage,
        setCurrentPage
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
