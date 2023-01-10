import {
  createMultisigThresholdPubkey,
  MultisigThresholdPubkey,
  pubkeyToAddress,
} from "@cosmjs/amino";
import axios from "axios";
import { AccountData, getAccountData } from "./account";

/**
 * Turns array of compressed Secp256k1 pubkeys
 * into a multisig using comsjs
 *
 * @param {array} compressedPubkeys Must be an array of compressed Secp256k1 pubkeys (e.g 'A8B5KVhRz1oQuV1dguzFdGBhHrIU/I+R/QfBZcbZFWVG').
 * @param {number} threshold the number of signers required to sign messages from this multisig
 * @param {string} addressPrefix chain based prefix for the address (e.g. 'cosmos')
 * @param {string} chainId chain-id for the multisig (e.g. 'cosmoshub-4')
 * @return {string} The multisig address.
 */
const createMultisigFromCompressedSecp256k1Pubkeys = async (
  compressedPubkeys: string[],
  threshold: number,
  addressPrefix: string,
  chainId: string,
): Promise<string> => {
  const pubkeys = compressedPubkeys.map((compressedPubkey) => {
    return {
      type: "tendermint/PubKeySecp256k1",
      value: compressedPubkey,
    };
  });
  const multisigPubkey = createMultisigThresholdPubkey(pubkeys, threshold);
  const multisigAddress = pubkeyToAddress(multisigPubkey, addressPrefix);

  // save multisig to fauna
  const multisig = {
    address: multisigAddress,
    pubkeyJSON: JSON.stringify(multisigPubkey),
    chainId,
  };

  await axios.post(`/api/chain/${chainId}/multisig`, multisig);

  return multisigAddress;
};

/**
 * This gets a multisigs account (pubkey, sequence, account number, etc) from
 * a node and/or the api if the multisig was made on this app.
 *
 * The public key should always be available, either on chain or in the app's database.
 * The account is only available when the there was any on-chain activity such as
 * receipt of tokens.
 */
const getMultisigAccount = async (
  address: string,
  chainId: string,
): Promise<MultisigThresholdPubkey> => {
  const res = await axios.get(`/api/chain/${chainId}/multisig/${address}`);

  if (res.status !== 200) {
    throw new Error("Multisig has no pubkey on node, and was not created using this tool.");
  }
  const pubkey: MultisigThresholdPubkey = JSON.parse(res.data.pubkeyJSON);

  return pubkey;
};

export { createMultisigFromCompressedSecp256k1Pubkeys, getMultisigAccount };
