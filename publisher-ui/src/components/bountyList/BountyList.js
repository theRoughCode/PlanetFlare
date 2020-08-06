import React from 'react';
import BountyItem from '../bountyItem/BountyItem';
import './BountyList.css'

class BountyList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      account: props.account,
      web3: props.web3,
      pfcContract: props.pfcContract
    };

    this.createBounty = this.createBounty.bind(this);
  }

  componentWillMount() {
    this.loadBounties();
  }

  async loadBounties() {
    const contract = this.state.pfcContract;

    const bountyIDs = await contract.methods.getBountiesForPublisher(this.state.account).call();

    const bounties = await Promise.all(
      bountyIDs.map(id => contract.methods.getBounty(id).call())
    )

    let updatedState = this.state;
    updatedState.bounties = bounties;
    updatedState.loaded = true;

    this.setState(updatedState);
  }

  async createBounty() {
    // TOOD: Richard, upload bucket to Textile and give me the bucketID and costPerToken

    // TODO: don't hardcode this and expose a UI for the user to specify this
    let costPerToken = 1;
    let bucketID = 'foo';

    console.log(this.state);
    const PlanetFlareContract = this.state.pfcContract;

    PlanetFlareContract.methods.createBounty(bucketID, costPerToken).send({
      from: this.state.account,
      gas: 50000000
    }).then((_) => this.loadBounties());
  }

  render() {
    if (!this.state.loaded) return null;

    const bountyItems = this.state.bounties.map(
      bounty =>
      <BountyItem 
        key={bounty[0]}
        className="bountyItem"
        id={bounty[0]}
        publisher={bounty[1]}
        bucketID={bounty[2]}
        costPerToken={bounty[3]}
        lastUpdated={bounty[4]}
      >
      </BountyItem>
    );

    let bodyItem;
    if (bountyItems.length > 0) {
      bodyItem = (<table>
        <thead>
          <tr>
            <th>Bounty ID</th>
            <th>Publisher Address</th>
            <th>Bucket ID</th>
            <th>Cost per token</th>
          </tr>
        </thead>
        <tbody>
          {bountyItems}
        </tbody>
      </table>);
    }
    else
      bodyItem = (<p className="emptyBountyList">No Bounties :(</p>);

    return (
      <div className="bountyList">
        <button className="createBountyBtn" style={{backgroundColor:"#f00"}} onClick={this.createBounty.bind(this)}>
          Create Bounty
        </button>
        {bodyItem}
      </div>
    );
  }
}

export default BountyList;
