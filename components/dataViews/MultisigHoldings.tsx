import React from "react";
import StackableContainer from "../layout/StackableContainer";
import { CoinPretty } from "@keplr-wallet/unit";

interface Props {
  holdings?: CoinPretty;
}

const MultisigHoldings = (props: Props) => {
  return (
    <StackableContainer lessPadding fullHeight>
      <h2>Holdings</h2>
      <StackableContainer lessPadding lessMargin>
        {props.holdings ? <span>{props.holdings.trim(true).toString()}</span> : <span>None</span>}
      </StackableContainer>
      <style jsx>{`
        span {
          text-align: center;
        }
      `}</style>
    </StackableContainer>
  );
};

export default MultisigHoldings;
