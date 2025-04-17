"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface UserContextType {
  userAvatar: string;
  updateAvatar: (newAvatar: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userAvatar, setUserAvatar] = useState<string>("");

  const updateAvatar = (newAvatar: string) => {
    setUserAvatar(newAvatar);
  };

  return (
    <UserContext.Provider value={{ userAvatar, updateAvatar }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUserContext deve ser usado dentro de um UserProvider");
  }

  return context;
}
