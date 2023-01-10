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

  return accountData;
};
