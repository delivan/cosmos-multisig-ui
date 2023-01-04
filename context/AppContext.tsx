import React, { useEffect, createContext, useContext, useReducer } from "react";

import { AppReducer, ChangeChainAction, initialState } from "./AppReducer";
import { ChainInfo } from "../types";

export interface AppContextType {
  chain: ChainInfo;
}

const AppContext = createContext<{
  state: AppContextType;
  dispatch: React.Dispatch<ChangeChainAction>;
}>({ state: initialState, dispatch: () => {} });

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  const contextValue = { state, dispatch };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
export function useAppContext() {
  return useContext(AppContext);
}
