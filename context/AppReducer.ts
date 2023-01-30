import { ChainInfo } from "../types";
import { AppContextType } from "./AppContext";

export const initialState: AppContextType = {
  chain: {
    lcd: "",
    rpc: "",
    denom: "",
    displayDenom: "",
    displayDenomExponent: 0,
    gasPrice: "",
    chainId: "",
    chainDisplayName: "",
    addressPrefix: "",
  },
};

export interface ChangeChainAction {
  type: "changeChain";
  value: ChainInfo;
}

export const AppReducer = (state: AppContextType, action: ChangeChainAction) => {
  switch (action.type) {
    case "changeChain": {
      return {
        ...state,
        chain: action.value,
      };
    }
  }
};
