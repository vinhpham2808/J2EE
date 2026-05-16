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

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        clearUser: () => setUser(null),
        currentPage,
        setCurrentPage
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
