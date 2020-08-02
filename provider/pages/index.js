import { useEffect, useRef } from "react";
import Web3 from "web3";
import io from "socket.io-client";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Badge from "@material-ui/core/Badge";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import NotificationsIcon from "@material-ui/icons/Notifications";
import Balance from "./Balance";
import Logs from "./Logs";
import Status from "./Status";

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
  const socketRef = useRef();
  const logsContainerRef = useRef(null);
  const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on("status", (status) => {
      setIpfsReady(status.ready);
      setPeerId(status.peerId || "");
      setIpfsLocation(status.location || "");
      setPaymentStrategies(status.paymentStrategies || []);
      setCacheStrategies(status.cacheStrategies || []);
    });

    socketRef.current.on("logs", (data) => updateLogs(data));

    if (!ethEnabled()) {
      alert(
        "Please install an Ethereum-compatible browser or extension like MetaMask to use this dApp!"
      );
    }

    return () => socketRef.current.close();
  }, []);

  useEffect(() => {
    logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  }, [logs.length]);

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

  const startHandler = () => {
    socketRef.current.emit("start");
  };

  const shutdownHandler = () => {
    socketRef.current.emit("shutdown");
  };

  const paymentStrategyHandler = (paymentStrategy) => {
    socketRef.current.emit("command", {
      command: "set-payment-strategy",
      args: {
        paymentStrategy,
      },
    });
  };

  const cacheStrategyHandler = (cacheStrategy) => {
    socketRef.current.emit("command", {
      command: "set-cache-strategy",
      args: {
        cacheStrategy,
      },
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
          <IconButton color="inherit">
            <Badge badgeContent={4} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
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
                <Balance web3={web3} />
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
