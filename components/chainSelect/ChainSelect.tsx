import { StargateClient } from "@cosmjs/stargate";
import axios from "axios";
import React, { useEffect, useState } from "react";

import { assert } from "@cosmjs/utils";
import { ChainInfo } from "@keplr-wallet/types";
import { useAppContext } from "../../context/AppContext";
import GearIcon from "../icons/Gear";
import Button from "../inputs/Button";
import Input from "../inputs/Input";
import Select from "../inputs/Select";
import StackableContainer from "../layout/StackableContainer";

interface ChainSelectOption {
  label: string;
  value: number;
}

interface GithubChainRegistryItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

const ChainSelect = () => {
  const { state, dispatch } = useAppContext();

  // UI State
  const [chainInfos, setChainInfos] = useState<ChainInfo[]>([]);
  const [chainSelectOptions, setChainSelectOptions] = useState<ChainSelectOption[]>([]);
  const [chainError, setChainError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectValue, setSelectValue] = useState({ label: "Loading...", value: -1 });

  // Chain State
  const [tempChainId, setChainId] = useState(state.chain.chainId);
  const [tempNodeAddress, setNodeAddress] = useState(state.chain.nodeAddress);
  const [tempAddressPrefix, setAddressPrefix] = useState(state.chain.addressPrefix);
  const [tempDenom, setDenom] = useState(state.chain.denom);
  const [tempDisplayDenom, setDisplayDenom] = useState(state.chain.displayDenom);
  const [tempDisplayDenomExponent, setDisplayDenomExponent] = useState(
    state.chain.displayDenomExponent,
  );
  const [tempGasPrice, setGasPrice] = useState(state.chain.gasPrice);
  const [tempChainName, setChainName] = useState(state.chain.chainDisplayName);

  const url = "https://api.github.com/repos/chainapsis/keplr-chain-registry/contents/cosmos";

  useEffect(() => {
    getGhJson();
  }, []);

  useEffect(() => {
    if (chainInfos.length > 0 && state.chain.chainId) {
      const defaultSelectOptionIndex = chainInfos.findIndex(
        (chainInfo) => chainInfo.chainId === state.chain.chainId,
      );

      setSelectValue({
        label: chainInfos[defaultSelectOptionIndex].chainName,
        value: defaultSelectOptionIndex,
      });
    }
  }, [state.chain.chainId, chainInfos.length]);

  useEffect(() => {
    // set settings form fields to new values
    setChainId(state.chain.chainId);
    setNodeAddress(state.chain.nodeAddress);
    setAddressPrefix(state.chain.addressPrefix);
    setDenom(state.chain.denom);
    setDisplayDenom(state.chain.displayDenom);
    setDisplayDenomExponent(state.chain.displayDenomExponent);
    setGasPrice(state.chain.gasPrice);
    setChainName(state.chain.chainDisplayName);
  }, [state]);

  const getGhJson = async () => {
    // getting chain info from this repo: https://github.com/cosmos/chain-registry
    try {
      const chainInfoFiles: GithubChainRegistryItem[] = (await axios.get(url)).data;
      const newChainInfos = (
        await Promise.allSettled(
          chainInfoFiles.map(async (chainInfoFile) => {
            const chainInfoUrl = `https://cdn.jsdelivr.net/gh/chainapsis/keplr-chain-registry@master/${chainInfoFile.path}`;
            return (await axios.get(chainInfoUrl)).data;
          }),
        )
      )
        .filter(
          (promise): promise is PromiseFulfilledResult<ChainInfo> => promise.status === "fulfilled",
        )
        .map((promise) => promise.value);
      const options = newChainInfos.map(({ chainName }: ChainInfo, index: number) => {
        return { label: chainName, value: index };
      });
      setChainInfos(newChainInfos);
      setChainSelectOptions(options);
      const defaultSelectOptionIndex = state.chain.chainId
        ? newChainInfos.findIndex((chainInfo) => chainInfo.chainId === state.chain.chainId)
        : newChainInfos.findIndex((chainInfo) => chainInfo.chainId.startsWith("cosmoshub"));
      setSelectValue({
        label: newChainInfos[defaultSelectOptionIndex].chainName,
        value: defaultSelectOptionIndex,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(error);
      setShowSettings(true);
      setChainError(error.message);
    }
  };

  const onChainSelect = (option: ChainSelectOption) => {
    const index = chainSelectOptions.findIndex((opt) => opt.label === option.label);
    const selectedChainInfo = chainInfos[index];
    setSelectValue(chainSelectOptions[index]);
    // change app state
    dispatch({
      type: "changeChain",
      value: {
        nodeAddress: selectedChainInfo.rpc,
        denom: selectedChainInfo.stakeCurrency.coinMinimalDenom,
        displayDenom: selectedChainInfo.stakeCurrency.coinDenom,
        displayDenomExponent: selectedChainInfo.stakeCurrency.coinDecimals,
        gasPrice: `${selectedChainInfo.feeCurrencies[0].gasPriceStep?.average}${selectedChainInfo.stakeCurrency.coinMinimalDenom}`,
        chainId: selectedChainInfo.chainId,
        chainDisplayName: selectedChainInfo.chainName,
        addressPrefix: selectedChainInfo.bech32Config.bech32PrefixAccAddr,
      },
    });
  };

  const setChainFromForm = async () => {
    setChainError(null);
    try {
      dispatch({
        type: "changeChain",
        value: {
          nodeAddress: tempNodeAddress,
          denom: tempDenom,
          displayDenom: tempDisplayDenom,
          displayDenomExponent: tempDisplayDenomExponent,
          gasPrice: tempGasPrice,
          chainId: tempChainId,
          chainDisplayName: tempChainName,
          addressPrefix: tempAddressPrefix,
        },
      });
      setShowSettings(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(error);
      setShowSettings(true);
      setChainError(error.message);
    }
  };

  return (
    <div className="chain-select-container">
      <StackableContainer lessPadding base>
        <p>Select Chain</p>
        <div className="flex">
          <div className="select-parent">
            <Select
              options={chainSelectOptions}
              onChange={onChainSelect}
              value={selectValue}
              name="chain-select"
            />
          </div>
          {showSettings ? (
            <button className="remove" onClick={() => setShowSettings(!showSettings)}>
              ✕
            </button>
          ) : (
            <button onClick={() => setShowSettings(!showSettings)}>
              <GearIcon color="white" />
            </button>
          )}
        </div>
        {showSettings && (
          <>
            {chainError && <p className="error">{chainError}</p>}
            <StackableContainer lessPadding lessMargin lessRadius>
              <p>Settings</p>
              <div className="settings-group">
                <Input
                  width="48%"
                  value={tempChainName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setChainName(e.target.value)
                  }
                  label="Chain Name"
                />

                <Input
                  width="48%"
                  value={tempChainId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChainId(e.target.value)}
                  label="Chain ID"
                />
              </div>
              <div className="settings-group">
                <Input
                  width="48%"
                  value={tempAddressPrefix}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAddressPrefix(e.target.value)
                  }
                  label="Bech32 Prefix (address prefix)"
                />
                <Input
                  width="48%"
                  value={tempNodeAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNodeAddress(e.target.value)
                  }
                  label="RPC Node URL (must be https)"
                />
              </div>
              <div className="settings-group">
                <Input
                  width="48%"
                  value={tempDisplayDenom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDisplayDenom(e.target.value)
                  }
                  label="Display Denom"
                />
                <Input
                  width="48%"
                  value={tempDenom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDenom(e.target.value)}
                  label="Base Denom"
                />
              </div>
              <div className="settings-group">
                <Input
                  width="48%"
                  value={tempDisplayDenomExponent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDisplayDenomExponent(parseInt(e.target.value, 10))
                  }
                  label="Denom Exponent"
                />
                <Input
                  width="48%"
                  value={tempGasPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGasPrice(e.target.value)}
                  label="Gas Price"
                />
              </div>
              <Button label="Set Chain" onClick={setChainFromForm} />
            </StackableContainer>
          </>
        )}
      </StackableContainer>
      <style jsx>{`
        .chain-select-container {
          position: absolute;
          z-index: 10;
          top: 1em;
          right: 1em;
          width: ${showSettings ? "600px" : "300px"};
        }
        .flex {
          margin-top: 0.5em;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .select-parent {
          width: calc(98% - 3em);
        }
        .settings-group {
          display: flex;
          justify-content: space-between;
          margin-top: 1.5em;
        }
        button {
          background: none;
          border: none;
          display: block;
          width: 3em;
          height: 3em;
          opacity: 0.7;
          user-select: none;
        }
        button:hover {
          opacity: 1;
        }
        button.remove {
          background: rgba(255, 255, 255, 0.2);

          border-radius: 50%;
          border: none;
          color: white;
        }
        .error {
          color: coral;
          font-size: 0.8em;
          text-align: left;
          margin: 1em 0 0 0;
        }
      `}</style>
    </div>
  );
};

export default ChainSelect;
