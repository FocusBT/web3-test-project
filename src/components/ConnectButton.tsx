import { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import { useWeb3React } from "@web3-react/core";
import {
  Button,
  Box,
  Text,
  Input,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import { injected } from "../config/wallets";
import abi from "./abi.json";
import { AbiItem } from "web3-utils";




declare global {
  interface Window {
    ethereum: any;
  }
}

export default function ConnectButton() {
  const { account, active, activate, library, deactivate } = useWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [connected, setConnected] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>("0");
  const [babyBalance, setBabyBalance] = useState<string>("0");
  const [mode, setMode] = useState<string>("BNB");
  const [recieverAdd, setRecieverAdd] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<number>(0);
  const [gasFee, setGasFee] = useState<string>('');
  const [gasLimit, setGasLimit] = useState<number>(0);
  const toast = useToast();

  function handleConnectWallet() {
    connected ? deactivate() : activate(injected);
    setConnected(!connected);
  }

  function handleMode() {
    setMode(mode === "BNB" ? "BabyDoge" : "BNB");
  }

  function handleChangeAddress(event: any) {
    setRecieverAdd(event.target.value);
  }

  function handleChangeAmount(event: any) {
    setSendAmount(event.target.value);
  }

  async function handleOpenModal() {
    if (!recieverAdd) {
      return toast({
        description: "Please input Receiver Address",
        status: "error",
      });
    }
    if (!sendAmount || sendAmount === 0) {
      return toast({
        description: "Please input send amount",
        status: "error",
      });
    }

    const web3 = new Web3(library.provider);
    var block = await web3.eth.getBlock("latest");
    setGasLimit(block.gasLimit);

    const gasPrice = await web3.eth.getGasPrice();
    setGasFee(toGWei(web3, gasPrice.toString()));

    onOpen();
  }

  const sendBaby = useCallback(async (addr: string, amount: number) => {   // due to async and we are using useState using useState values are causing errors sometimes so I just passed values.
    const web3 = new Web3(library.provider);
    const ctx = new web3.eth.Contract(
      abi as AbiItem[],
      "0x75014115adf8E7ad4462D13698b87F0cB15d1067" // Ive added my new token called MTK because earlier token's abi was not valid
    );
    // await ctx.methods.approve(account, sendAmount).call();   WE DONT NEED APPROVE FUNCTION HERE, USER CAN DIRECTLY USE TRANSFER FUNCTION HERE

    // if there is no decimals() function
    const sendAmountInWei = web3.utils.toWei(sendAmount.toString(), 'ether');

    // if there is decimals() function in the smart contract:
    const decimals = await ctx.methods.decimals().call();
    const sendAmountWithDecimals = amount * Math.pow(10, decimals);
    const sendAmountInBN = web3.utils.toBN(sendAmountWithDecimals.toString());

    const transferResult = await ctx.methods.transfer(addr, sendAmountInBN).send({ from: account });
    const txn = transferResult.transactionHash;
    fetch('http://localhost:5000/api/saveTransaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: account,
        receiver: addr,
        amount: amount,
        txn,
      }),
    }).then(response => response.json())
      .then(data => console.log(data))
      .catch(err => console.error('Failed to save transaction data:', err));

  }, [account, library]);

  const sendAction = useCallback(async () => {

    if (mode === "BNB") {
      const web3 = new Web3(library.provider);

      const txParams: any = {
        from: account,
        to: recieverAdd,

        value: Web3.utils.toWei(sendAmount.toString(), "ether"),
      };

      console.log(txParams);
      await web3.eth.sendTransaction(txParams, (error: any, hash: any) => {
        if (error) {
          console.error(error);
        } else {
          console.log(`Transaction hash: ${hash}`);
          web3.eth.getTransaction(hash, (error, transaction) => {
            if (error) {
              return;
            }

            fetch('http://localhost:5000/api/saveTransaction', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sender: account,
                receiver: recieverAdd,
                amount: sendAmount,
                txn: hash,
              }),
            }).then(response => response.json())
              .then(data => console.log(data))
              .catch(err => console.error('Failed to save transaction data:', err));

            console.log(`Transaction data: ${transaction?.input}`);
          });
        }
      })

    } else if (mode === "BabyDoge") {
      console.log("called", sendAmount, recieverAdd)
      sendBaby(recieverAdd, sendAmount);
    } else {
      return toast({
        description: "Invalid Token",
        status: "error",
      });
    }


    onClose();
    valueload();
  }, [account, library, recieverAdd, sendAmount]);

  function fromWei(
    web3: { utils: { fromWei: (arg0: any) => any } },
    val: { toString: () => any }
  ) {
    if (val) {
      val = val.toString();
      return web3.utils.fromWei(val);
    } else {
      return "0";
    }
  }

  function toGWei(
    web3: any,
    val: string
  ) {
    if (val) {
      return web3.utils.fromWei(val, 'gwei');
    } else {
      return "0";
    }
  }

  const valueload = useCallback(async () => {
    const web3 = new Web3(library.provider);
    const ctx = new web3.eth.Contract(
      abi as AbiItem[],
      "0x75014115adf8E7ad4462D13698b87F0cB15d1067"
    );
    console.log(ctx);
    if (account) {
      const value = await web3.eth.getBalance(account);
      setBalance(Number(fromWei(web3, value)).toFixed(5));

      const gasPrice = await web3.eth.getGasPrice();
      setGasFee(gasPrice);

      const decimals = await ctx.methods.decimals().call();
      const balance = await ctx.methods.balanceOf(account).call();
      const value1 = Number(balance) / Math.pow(10, decimals);
      setBabyBalance(value1.toFixed(5));
    }
  }, [account, library]);

  useEffect(() => {
    active && valueload();
  }, [account, active, valueload]);

  return account ? (
    <Box
      display="block"
      alignItems="center"
      background="white"
      borderRadius="xl"
      p="4"
      width="300px"
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="2"
      >
        <Text color="#158DE8" fontWeight="medium">
          Account:
        </Text>
        <Text color="#6A6A6A" fontWeight="medium">
          {`${account.slice(0, 6)}...${account.slice(
            account.length - 4,
            account.length
          )}`}
        </Text>
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="2"
      >
        <Text color="#158DE8" fontWeight="medium">
          BabyDoge Balance :
        </Text>
        <Text color="#6A6A6A" fontWeight="medium">
          {babyBalance}
        </Text>
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="2"
      >
        <Text color="#158DE8" fontWeight="medium">
          BNB Balance:
        </Text>
        <Text color="#6A6A6A" fontWeight="medium">
          {balance}
        </Text>
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="2"
      >
        <Text color="#158DE8" fontWeight="medium">
          BNB / BabyDoge
        </Text>
        <Switch size="md" value={mode} onChange={handleMode} />
      </Box>
      <Box
        display="block"
        justifyContent="space-between"
        alignItems="center"
        mb="4"
      >
        <Text color="#158DE8" fontWeight="medium">
          Send {mode}:
        </Text>
        <Input
          bg="#EBEBEB"
          size="lg"
          value={recieverAdd}
          onChange={handleChangeAddress}
        />
      </Box>
      <Box display="flex" alignItems="center" mb="4">
        <Input
          bg="#EBEBEB"
          size="lg"
          value={sendAmount}
          onChange={handleChangeAmount}
        />
        <Button
          onClick={handleOpenModal}
          bg="#158DE8"
          color="white"
          fontWeight="medium"
          borderRadius="xl"
          ml="2"
          border="1px solid transparent"
          _hover={{
            borderColor: "blue.700",
            color: "gray.800",
          }}
          _active={{
            backgroundColor: "blue.800",
            borderColor: "blue.700",
          }}
        >
          Send
        </Button>
      </Box>
      <Box display="flex" justifyContent="center" alignItems="center">
        <Button
          onClick={handleConnectWallet}
          bg="#158DE8"
          color="white"
          fontWeight="medium"
          borderRadius="xl"
          border="1px solid transparent"
          width="300px"
          _hover={{
            borderColor: "blue.700",
            color: "gray.800",
          }}
          _active={{
            backgroundColor: "blue.800",
            borderColor: "blue.700",
          }}
        >
          Disconnect Wallet
        </Button>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Are you Sure?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div>Are you sure {sendAmount} {mode} to {recieverAdd} user?</div>
            <div>Gas Limit: {gasLimit}</div>
            <div>Gas Price: {gasFee}</div>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost" onClick={sendAction}>
              Send
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  ) : (
    <Box bg="white" p="4" borderRadius="xl">
      <Button
        onClick={handleConnectWallet}
        bg="#158DE8"
        color="white"
        fontWeight="medium"
        borderRadius="xl"
        border="1px solid transparent"
        width="300px"
        _hover={{
          borderColor: "blue.700",
          color: "gray.800",
        }}
        _active={{
          backgroundColor: "blue.800",
          borderColor: "blue.700",
        }}
      >
        Connect Wallet
      </Button>
    </Box>
  );
}
