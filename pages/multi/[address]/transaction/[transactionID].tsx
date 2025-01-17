import axios from "axios";
import React from "react";
import { GetServerSideProps } from "next";
import { StargateClient, makeMultisignedTx, Account } from "@cosmjs/stargate";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { fromBase64 } from "@cosmjs/encoding";
import { MultisigThresholdPubkey } from "@cosmjs/amino";

import { DbSignature, DbTransaction } from "../../../../types";
import { useAppContext } from "../../../../context/AppContext";
import Button from "../../../../components/inputs/Button";
import { getMultisigAccount } from "../../../../lib/multisigHelpers";
import Page from "../../../../components/layout/Page";
import StackableContainer from "../../../../components/layout/StackableContainer";
import ThresholdInfo from "../../../../components/dataViews/ThresholdInfo";
import TransactionInfo from "../../../../components/dataViews/TransactionInfo";
import TransactionSigning from "../../../../components/forms/TransactionSigning";
import CompletedTransaction from "../../../../components/dataViews/CompletedTransaction";
import { assert } from "@cosmjs/utils";
import clientPromise from "../../../../lib/mongodbHelpers";
import { ObjectId } from "mongodb";

interface Props {
  props: {
    transactionJSON: string;
    transactionID: string;
    txHash: string;
    signatures: DbSignature[];
  };
}

export const getServerSideProps: GetServerSideProps = async (context): Promise<Props> => {
  // get transaction info from db
  const transactionID = context.params?.transactionID?.toString() ?? "";

  const client = await clientPromise;
  const db = client.db("keplr-multisig");

  const transaction = await db.collection("transactions").findOne({
    _id: new ObjectId(transactionID),
  });

  return {
    props: {
      transactionJSON: transaction?.dataJSON || "",
      txHash: transaction?.txHash || "",
      transactionID,
      signatures: transaction?.signatures || [],
    },
  };
};

const transactionPage = ({
  multisigAddress,
  transactionJSON,
  transactionID,
  signatures,
  txHash,
}: {
  multisigAddress: string;
  transactionJSON: string;
  transactionID: string;
  signatures: DbSignature[];
  txHash: string;
}) => {
  const { state } = useAppContext();
  const [currentSignatures, setCurrentSignatures] = useState(signatures);
  const [broadcastError, setBroadcastError] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [transactionHash, setTransactionHash] = useState(txHash);
  const [pubkey, setPubkey] = useState<MultisigThresholdPubkey>();
  const [accountError, setAccountError] = useState(null);
  const txInfo: DbTransaction = (transactionJSON && JSON.parse(transactionJSON)) || null;
  const router = useRouter();

  const addSignature = (signature: DbSignature) => {
    setCurrentSignatures((prevState: DbSignature[]) => [...prevState, signature]);
  };

  useEffect(() => {
    const fetchMultisig = async (address: string) => {
      try {
        const result = await getMultisigAccount(address, state.chain.chainId);
        setPubkey(result);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setAccountError(error.toString());
        console.log("Account error:", error);
      }
    };

    const address = router.query.address?.toString();
    if (address && state.chain.chainId) {
      fetchMultisig(address);
    }
  }, [state.chain.chainId, router.query.address]);

  const broadcastTx = async () => {
    try {
      setIsBroadcasting(true);
      setBroadcastError("");

      assert(pubkey, "Pubkey not found on chain or in database");
      const bodyBytes = fromBase64(currentSignatures[0].bodyBytes);

      console.log(pubkey, txInfo, bodyBytes, currentSignatures);
      const signedTx = makeMultisignedTx(
        pubkey,
        txInfo.sequence,
        txInfo.fee,
        bodyBytes,
        new Map(currentSignatures.map((s) => [s.address, fromBase64(s.signature)])),
      );

      const result = await window.keplr.sendTx(
        state.chain.chainId,
        Uint8Array.from(TxRaw.encode(signedTx).finish()),
        "sync",
      );
      const newTxHash = Buffer.from(result).toString("hex");
      console.log(newTxHash);
      const _res = await axios.post(`/api/transaction/${transactionID}`, {
        txHash: newTxHash,
      });
      setTransactionHash(newTxHash);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setIsBroadcasting(false);
      setBroadcastError(e.toString());
    }
  };

  return (
    <Page rootMultisig={multisigAddress}>
      <StackableContainer base>
        <StackableContainer>
          <h1>{transactionHash ? "Completed Transaction" : "In Progress Transaction"}</h1>
        </StackableContainer>
        {accountError && (
          <StackableContainer>
            <div className="multisig-error">
              <p>Multisig address could not be found.</p>
            </div>
          </StackableContainer>
        )}
        {transactionHash && <CompletedTransaction transactionHash={transactionHash} />}
        <TransactionInfo tx={txInfo} />
        {!transactionHash && pubkey && (
          <ThresholdInfo signatures={currentSignatures} pubkey={pubkey} />
        )}
        {pubkey &&
          currentSignatures.length >= parseInt(pubkey.value.threshold, 10) &&
          !transactionHash && (
            <>
              <Button
                label={isBroadcasting ? "Broadcasting..." : "Broadcast Transaction"}
                onClick={broadcastTx}
                primary
                disabled={isBroadcasting}
              />
              {broadcastError && <div className="broadcast-error">{broadcastError}</div>}
            </>
          )}
        {!transactionHash && (
          <TransactionSigning
            tx={txInfo}
            transactionID={transactionID}
            signatures={currentSignatures}
            addSignature={addSignature}
          />
        )}
      </StackableContainer>

      <style jsx>{`
        .broadcast-error {
          background: firebrick;
          margin: 20px auto;
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          font-family: monospace;
          max-width: 475px;
        }
        .multisig-error p {
          max-width: 550px;
          color: red;
          font-size: 16px;
          line-height: 1.4;
        }
      `}</style>
    </Page>
  );
};

export default transactionPage;
