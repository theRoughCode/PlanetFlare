import React from 'react';
import './App.css';
import Web3 from 'web3';
import Upload from './components/upload/Upload';

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
    if(!this.state.loaded) return null;
    return (
      <div className="App">
        {/* <div className="Card">
          <p className="accountBalanceLabel:">Account balance: {this.state.accountBalance}</p>
        </div> */}
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

export default App;
