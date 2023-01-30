import { Currency } from "@keplr-wallet/types";
import { CoinPretty, Dec } from "@keplr-wallet/unit";
import axios from "axios";

export interface AccountData {
  "@type": string;
  address: string;
  pub_key: {
    "@type": string;
    key: string;
  };
  account_number: string;
  sequence: string;
}

export const getAccountData = async (lcd: string, bech32Address: string) => {
  const {
    data: { account: accountData },
  } = await axios.get<{
    account: AccountData;
  }>(`${lcd}/cosmos/auth/v1beta1/accounts/${bech32Address}`);

  console.log("test");
  return accountData;
};

export const getBalance = async (lcd: string, bech32Address: string, currency: Currency) => {
  const {
    data: { balances },
  } = await axios.get<{
    balances: {
      amount: string;
      denom: string;
    }[];
    pagination: {
      next_key: string | null;
      total: string;
    };
  }>(`${lcd}/cosmos/bank/v1beta1/balances/${bech32Address}`);

  const balance = balances.find((bal) => bal.denom === currency.coinMinimalDenom);

  if (balance) {
    return new CoinPretty(currency, new Dec(balance.amount));
  }

  return new CoinPretty(currency, new Dec(0));
};
