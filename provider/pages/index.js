import { useEffect, useRef } from "react";
import Web3 from "web3";
import io from "socket.io-client";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Balance from "./Balance";
import Logs from "./Logs";
import Status from "./Status";
import Tokens from "./Tokens";

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  title: {
    flexGrow: 1,
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: "100vh",
    overflow: "auto",
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  fixedHeight: {
    height: 280,
  },
  logsBackground: {
    backgroundColor: "black",
    height: 400,
  },
}));

const MAX_LOGS_SIZE = 100;

export default function Main(props) {
  const classes = useStyles();
  const [ipfsReady, setIpfsReady] = React.useState(false);
  const [peerId, setPeerId] = React.useState("");
  const [ipfsLocation, setIpfsLocation] = React.useState("");
  const [paymentStrategies, setPaymentStrategies] = React.useState(["DEFAULT"]);
  const [cacheStrategies, setCacheStrategies] = React.useState(["DEFAULT"]);
  const [logs, setLogs] = React.useState([]);
  const [web3, setWeb3] = React.useState(null);
  const [pfcAbi, setPfcAbi] = React.useState(null);
  const [pfcContractAddress, setPfcContractAddress] = React.useState(null);
  const [walletAddress, setWalletAddress] = React.useState(null);
  const [tokens, setTokens] = React.useState({});
  const [socket, setSocket] = React.useState(null);
  const logsContainerRef = useRef(null);
  const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);

  useEffect(() => {
    setSocket(io());

    if (!ethEnabled()) {
      alert(
        "Please install an Ethereum-compatible browser or extension like MetaMask to use this dApp!"
      );
    }
  }, []);

  useEffect(() => {
    if (socket == null) return;
    socket.on("status", (status) => {
      setIpfsReady(status.ready);
      setPeerId(status.peerId || "");
      setIpfsLocation(status.location || "");
      setPaymentStrategies(status.paymentStrategies || []);
      setCacheStrategies(status.cacheStrategies || []);
      setPfcAbi(status.pfcAbi);
      setPfcContractAddress(status.pfcContractAddress);
      setTokens(status.tokens);

      if (walletAddress != null) socket.emit("address", walletAddress);
    });

    socket.on("logs", updateLogs);
    socket.on("tokens", setTokens);
    return () => socket.close();
  }, [socket]);

  useEffect(() => {
    logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  }, [logs.length]);

  useEffect(() => {
    getWalletAddress();
  }, [web3]);

  const updateLogs = (newMsg) => {
    setLogs((prevLogs) => {
      let newLogs = [...prevLogs, newMsg];
      if (newLogs.length > MAX_LOGS_SIZE) {
        newLogs = newLogs.slice(-MAX_LOGS_SIZE);
      }
      return newLogs;
    });
  };

  const ethEnabled = () => {
    if (window.ethereum) {
      setWeb3(new Web3(window.ethereum));
      window.ethereum.enable();
      return true;
    }
    return false;
  };

  const getWalletAddress = async () => {
    if (web3 == null) return;
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return;
    setWalletAddress(accounts[0]);
    if (socket != null) socket.emit("address", accounts[0]);
  };

  const startHandler = () => {
    socket.emit("start");
  };

  const shutdownHandler = () => {
    socket.emit("shutdown");
  };

  const paymentStrategyHandler = (paymentStrategy) => {
    socket.emit("command", {
      command: "set-payment-strategy",
      args: {
        paymentStrategy,
      },
    });
  };

  const cacheStrategyHandler = (cacheStrategy) => {
    socket.emit("command", {
      command: "set-cache-strategy",
      args: {
        cacheStrategy,
      },
    });
  };

  const submitTokensHandler = () => {
    console.log("Submitting tokens!");
    socket.emit("command", {
      command: "submit-tokens",
    });
  };

  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <div>
      <CssBaseline />
      <AppBar position="absolute" className={classes.appBar}>
        <Toolbar>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          >
            Provider Dashboard
          </Typography>
          <Tokens tokens={tokens} onSubmitTokens={submitTokensHandler} />
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <Container maxWidth="lg" className={classes.container}>
          <Grid container spacing={3}>
            {/* IPFS Node status */}
            <Grid item xs={12} md={8} lg={9}>
              <Paper className={fixedHeightPaper}>
                <Status
                  ipfsReady={ipfsReady}
                  peerId={peerId}
                  ipfsLocation={ipfsLocation}
                  paymentStrategies={paymentStrategies}
                  paymentStrategyHandler={paymentStrategyHandler}
                  cacheStrategies={cacheStrategies}
                  cacheStrategyHandler={cacheStrategyHandler}
                  startHandler={startHandler}
                  shutdownHandler={shutdownHandler}
                />
              </Paper>
            </Grid>
            {/* Current Balance */}
            <Grid item xs={12} md={4} lg={3}>
              <Paper className={fixedHeightPaper}>
                <Balance
                  web3={web3}
                  pfcAbi={pfcAbi}
                  pfcContractAddress={pfcContractAddress}
                  walletAddress={walletAddress}
                />
              </Paper>
            </Grid>
            {/* Logs */}
            <Grid item xs={12}>
              <Paper
                ref={logsContainerRef}
                className={clsx(classes.paper, classes.logsBackground)}
              >
                <Logs logs={logs} />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </main>
    </div>
  );
}
