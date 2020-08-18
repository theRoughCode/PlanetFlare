import React from 'react';
import './App.css';
import Web3 from 'web3';
import Upload from './components/upload/Upload';

import { withStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

const useStyles = theme => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
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
  logo: {
    height: 45,
    marginRight: 10,
  },
});

class App extends React.Component {
  componentWillMount() {
    this.loadBlockchain();
  }
  
  async loadBlockchain() {
    if (window.ethereum) {
      await window.ethereum.enable();
    }
    window.backend = 'http://localhost:3001';

    const web3 = new Web3(window.ethereum || "ws://localhost:8545");
    const accounts = await web3.eth.getAccounts();

    const account = accounts[0];

    const response = await fetch(window.backend + '/contractABI');
    const contractInfo = await response.json();

    const contract = new web3.eth.Contract(contractInfo.abi, contractInfo.address);

    const accountBalance = await contract.methods.balanceOf(account).call();

    this.setState({
      account: account,
      accountBalance: accountBalance,
      web3: web3,
      pfcContract: contract,
      loaded: true
    });
  }

  constructor(props) {
    super(props);
    this.state = {};

    this.setBucketId = this.setBucketId.bind(this);
  }

  setBucketId(bucketId) {
    this.setState({
      bucketId
    });
  }

  render() {
    const { classes } = this.props;
    if(!this.state.loaded) return null;
    return (
      <div className="App">
        <CssBaseline />
        <AppBar position="absolute" className={classes.appBar}>
          <Toolbar>
            <img src={"pfc-logo.png"} className={classes.logo} alt="logo" />
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              className={classes.title}
            >
              Publisher Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <div className="Card">
          <Upload setBucketId={this.setBucketId}
            pfcContract={this.state.pfcContract}
            account={this.state.account}
          />
        </div>
      </div>
    );
  }
}

export default withStyles(useStyles)(App);
