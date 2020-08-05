import React from 'react';
import './css/App.css';
import Web3 from 'web3';
import BountyList from './components/BountyList';

class App extends React.Component {
  componentWillMount() {
    this.loadBlockchain();
  }
  
  async loadBlockchain() {
    window.backend = 'http://localhost:3001';

    const web3 = new Web3("ws://localhost:8545");
    const accounts = await web3.eth.getAccounts();

    const response = await fetch(window.backend + '/contractABI');
    const contractInfo = await response.json();

    const contract = new web3.eth.Contract(contractInfo.abi, contractInfo.address);

    this.setState({account: accounts[0], web3: web3, pfcContract: contract, loaded: true});
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    if (this.state.loaded)
      return (
        <div className="application">
          <BountyList 
            account={this.state.account}
            web3={this.state.web3}
            pfcContract={this.state.pfcContract}
          >
          </BountyList>
        </div>
      );
    else
      return <div className="application"></div>
  }
}

export default App;
