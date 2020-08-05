import React from 'react';
import BountyItem from './BountyItem';

class BountyList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      account: props.account,
      web3: props.web3,
      pfcContract: props.pfcContract
    };
  }

  componentWillMount() {
    this.loadBounties();
  }

  async loadBounties() {
    const contract = this.state.pfcContract;

    const bountyIDs = await contract.methods.getBountiesForPublisher(this.state.account).call();

    const bounties = await Promise.all(
      bountyIDs.map(id => contract.methods.getBountyID(id).call())
    )

    let updatedState = this.state;
    updatedState.bounties = bounties;
    updatedState.loaded = true;

    this.setState(updatedState);
  }

  render() {
    if (!this.state.loaded) return null;

    const bountyItems = this.state.bounties.map(
      bounty => <li>
      <BountyItem 
        className="bountyItem"
        id={bounty[0]}
        publisher={bounty[1]}
        bucketID={bounty[2]}
        costPerToken={bounty[3]}
        lastUpdated={bounty[4]}
      >
      </BountyItem>
      </li>
    )

    return (
      <div className="bountyList">
        <div className="createBountyBtn" style={{backgroundColor:"#f00"}}>
          <p>Create Bounty</p>
        </div>
         <ul>{bountyItems}</ul> 
      </div>
    );
  }
}

export default BountyList;
