import React, { useState, useEffect } from "react";
import { pubkeyToAddress, Pubkey, MultisigThresholdPubkey } from "@cosmjs/amino";
import { Account, StargateClient } from "@cosmjs/stargate";
import { assert } from "@cosmjs/utils";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import { useRouter } from "next/router";

import { useAppContext } from "../../../context/AppContext";
import Button from "../../../components/inputs/Button";
import { getMultisigAccount } from "../../../lib/multisigHelpers";
import HashView from "../../../components/dataViews/HashView";
import MultisigHoldings from "../../../components/dataViews/MultisigHoldings";
import MultisigMembers from "../../../components/dataViews/MultisigMembers";
import Page from "../../../components/layout/Page";
import StackableContainer from "../../../components/layout/StackableContainer";
import TransactionForm from "../../../components/forms/TransactionForm";
import DelegationForm from "../../../components/forms/DelegationForm";
import { getBalance } from "../../../lib/account";
import { Currency } from "@keplr-wallet/types";
import { CoinPretty } from "@keplr-wallet/unit";

function participantPubkeysFromMultisig(multisigPubkey: Pubkey) {
  return multisigPubkey.value.pubkeys;
}

function participantAddressesFromMultisig(multisigPubkey: Pubkey, addressPrefix: string) {
  return participantPubkeysFromMultisig(multisigPubkey).map((p: Pubkey) =>
    pubkeyToAddress(p, addressPrefix),
  );
}

const multipage = () => {
  const { state } = useAppContext();
  const [showSendTxForm, setShowSendTxForm] = useState(false);
  const [showDelegateTxForm, setShowDelegateTxForm] = useState(false);
  const [holdings, setHoldings] = useState<CoinPretty>();
  const [multisigAddress, setMultisigAddress] = useState("");
  const [accountOnChain, setAccountOnChain] = useState<Account | null>(null);
  const [pubkey, setPubkey] = useState<MultisigThresholdPubkey>();
  const [accountError, setAccountError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const address = router.query.address?.toString();
    if (address && state.chain.lcd) {
      setMultisigAddress(address);
      fetchMultisig(address);
    }
  }, [state.chain.lcd, router.query.address]);

  const fetchMultisig = async (address: string) => {
    setAccountError(null);
    try {
      const result = await getMultisigAccount(address, state.chain.chainId);
      const currency: Currency = {
        coinDenom: state.chain.displayDenom,
        coinMinimalDenom: state.chain.denom,
        coinDecimals: state.chain.displayDenomExponent,
      };
      const balance = await getBalance(state.chain.lcd, address, currency);
      setPubkey(result);
      setHoldings(balance);
    } catch (error: any) {
      setAccountError(error.message);
      console.log("Account error:", error);
    }
  };

  return (
    <Page>
      <StackableContainer base>
        <StackableContainer>
          <label>Multisig Address</label>
          <h1>
            {router.query.address ? (
              <HashView hash={router.query.address?.toString()} />
            ) : (
              "No Address"
            )}
          </h1>
        </StackableContainer>
        {pubkey && state.chain.addressPrefix && (
          <MultisigMembers
            members={participantAddressesFromMultisig(pubkey, state.chain.addressPrefix)}
            threshold={pubkey.value.threshold}
          />
        )}
        {accountError && (
          <StackableContainer>
            <div className="multisig-error">
              <p>
                This multisig address's pubkeys are not available, and so it cannot be used with
                this tool.
              </p>
              <p>
                You can recreate it with this tool here, or sign and broadcast a transaction with
                the tool you used to create it. Either option will make the pubkeys accessible and
                will allow this tool to use this multisig fully.
              </p>
            </div>
          </StackableContainer>
        )}
        {showSendTxForm && (
          <TransactionForm
            address={multisigAddress}
            closeForm={() => {
              setShowSendTxForm(false);
            }}
          />
        )}
        {showDelegateTxForm && (
          <DelegationForm
            address={multisigAddress}
            accountOnChain={accountOnChain}
            closeForm={() => {
              setShowDelegateTxForm(false);
            }}
          />
        )}
        {!showSendTxForm && !showDelegateTxForm && (
          <div className="interfaces">
            <div className="col-1">
              <MultisigHoldings holdings={holdings} />
            </div>
            <div className="col-2">
              <StackableContainer lessPadding>
                <h2>New transaction</h2>
                <p>
                  Once a transaction is created, it can be signed by the multisig members, and then
                  broadcast.
                </p>
                <Button
                  label="Create Transaction"
                  onClick={() => {
                    setShowSendTxForm(true);
                  }}
                />
                <Button
                  label="Create Delegation"
                  onClick={() => {
                    setShowDelegateTxForm(true);
                  }}
                />
              </StackableContainer>
            </div>
          </div>
        )}
      </StackableContainer>
      <style jsx>{`
        .interfaces {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          flex-direction: column;
        }
        .col-1 {
          flex: 1;
          padding-right: 0;
          margin-bottom: 50px;
        }
        .col-2 {
          flex: 1;
        }
        label {
          font-size: 12px;
          font-style: italic;
        }
        p {
          margin-top: 15px;
          max-width: 100%;
        }
        .multisig-error p {
          max-width: 550px;
          color: red;
          font-size: 16px;
          line-height: 1.4;
        }
        .multisig-error p:first-child {
          margin-top: 0;
        }
      `}</style>
    </Page>
  );
};

export default multipage;
