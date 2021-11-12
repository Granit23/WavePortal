import * as React from "react";
import { ethers, providers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';
import { Box, Input, Textarea, Button } from "@chakra-ui/react"

export default function App() {

  const contractAddress = '0x1507178BeeA21cA6F9BB071140d7dF545FdB852C';
  const contractABI = abi.abi;

  const [currentAccount, setCurrentAccount] = React.useState("");
  const [allWaves, setAllWaves] = React.useState([]);
  const [waveMessage, setWaveMessage] = React.useState("");


  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" })
      if (accounts.length != 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found.");
      }
    }  catch (error) {
    console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Get MetaMask!");
        return
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" })
      setCurrentAccount(accounts[0])
      console.log("Connected: ", accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        /*
        * You're using contractABI here
        */
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        let waveTxn = await wavePortalContract.wave(waveMessage, { gasLimit: 300000 } );
        console.log("Mining...");
        await waveTxn.wait();
        console.log("Mined --", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          })
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  React.useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  React.useEffect(() => {
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);
  
  return (
    <Box className="mainContainer">
      <Box display="flex" flexDir="column" justifyContent="center" maxW="600px">
        <Box className="header">
          👋 Hey there!
        </Box>

        <Box className="bio" paddingBottom="5px">
          Send me a wave and you have a 50% chance to win some test ETH! <br/>Powered by Rinkeby Testnet.
        </Box>
        <Textarea textColor="black" bg="white" focusBorderColor="tomato" onChange={(e) => setWaveMessage(e.target.value)}/>

        <Button className="waveButton" onClick={wave}>
          Wave at Me
        </Button>

        {!currentAccount && (
          <Button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </Button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <Box key={index} border="1px" borderColor="tomato" 
            borderRadius="5px" backgroundColor="tomato" marginTop="16px" padding="8px">
              <Box >Address: {wave.address}</Box>
              <Box>Time: {wave.timestamp.toString()}</Box>
              <Box>Message: {wave.message}</Box>
            </Box>)
        })}
      </Box>
    </Box>
  );
}
