import React, { Component } from "react";
import Dropzone from "../dropzone/Dropzone";
import "./Upload.css";
import Progress from "../progress/Progress";
import BountyItem from '../bountyItem/BountyItem';
import BountyTable from '../bountyTable/BountyTable';

class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      uploading: false,
      uploadProgress: {},
      successfulUploaded: false,
      pfcContract: props.pfcContract,
      account: props.account,
      web3: props.web3
    };

    this.onFilesAdded = this.onFilesAdded.bind(this);
    this.uploadFiles = this.uploadFiles.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
    this.renderActions = this.renderActions.bind(this);
  }

  componentWillMount() {
    this.loadBounties();
  }

  async loadBounties() {
    const contract = this.state.pfcContract;

    let updatedState = this.state;
    const bountyIDs = await contract.methods.getBountiesForPublisher(this.state.account).call();

    const bounties = await Promise.all(
      bountyIDs.map(id => contract.methods.getBounty(id).call())
    )

    updatedState.bounties = bounties;
    updatedState.loaded = true;

    this.setState(updatedState);
  }

  async createBounty(bucketID) {
    // TOOD: Richard, upload bucket to Textile and give me the bucketID and costPerToken

    // TODO: don't hardcode this and expose a UI for the user to specify this
    let costPerToken = 1;

    console.log(this.state);
    const PlanetFlareContract = this.state.pfcContract;

    PlanetFlareContract.methods.createBounty(bucketID, costPerToken).send({
      from: this.state.account,
      gas: 50000000
    }).then((_) => this.loadBounties());
  }

  onFilesAdded(files) {
    this.setState(prevState => ({
      files: prevState.files.concat(files)
    }));
  }

  async uploadFiles() {
    this.setState({ uploadProgress: {}, uploading: true });
    try {
      const res = await this.sendRequest(this.state.files);
      const bucketId = (await res.json()).bucketId;
      console.log(bucketId);
      this.createBounty(bucketId);
      this.setState({ successfulUploaded: true, uploading: false });
    } catch (e) {
      // Not Production ready! Do some error handling here instead...
      this.setState({ successfulUploaded: true, uploading: false });
    }
  }

  sendRequest(files) {
    const response = fetch("http://localhost:3001/upload", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({files: files.map(file => file.name)})
    });

    return response;
  }

  renderProgress(file) {
    const uploadProgress = this.state.uploadProgress[file.name];
    if (this.state.uploading || this.state.successfulUploaded) {
      return (
        <div className="ProgressWrapper">
          <Progress progress={uploadProgress ? uploadProgress.percentage : 0} />
          <img
            className="CheckIcon"
            alt="done"
            src="pfc-logo-24.gif"
            style={{
              opacity:
                uploadProgress && uploadProgress.state === "done" ? 0.5 : 0
            }}
          />
        </div>
      );
    }
  }

  renderActions() {
    if (this.state.successfulUploaded) {
      return (
        <button
          onClick={() =>
            this.setState({ files: [], successfulUploaded: false })
          }
        >
          Clear
        </button>
      );
    } else {
      return (
        <button
          disabled={this.state.files.length < 0 || this.state.uploading}
          onClick={this.uploadFiles}
        >
          Upload
        </button>
      );
    }
  }

  // renderBountyList() {
  //   if (!this.state.loaded) return null;

  //     // <BountyItem 
  //     //   key={bounty[0]}
  //     //   className="bountyItem"
  //     //   id={bounty[0]}
  //     //   publisher={bounty[1]}
  //     //   bucketID={bounty[2]}
  //     //   costPerToken={bounty[3]}
  //     //   lastUpdated={bounty[4]}
  //     // >
  //     // </BountyItem>
  //   );

  //   // let bodyItem;
  //   // if (bountyItems.length > 0) {
  //   //   bodyItem = (<table>
  //   //     <thead>
  //   //       <tr>
  //   //         <th>Bounty ID</th>
  //   //         <th>Publisher Address</th>
  //   //         <th>Bucket ID</th>
  //   //         <th>Cost per token</th>
  //   //       </tr>
  //   //     </thead>
  //   //     <tbody>
  //   //       {bountyItems}
  //   //     </tbody>
  //   //   </table>);
  //   // }
  //   // else
  //   //   bodyItem = (<p className="emptyBountyList">No Bounties :(</p>);

  //   // return (
  //   //   <div className="bountyList">
  //   //     {bodyItem}
  //   //   </div>
  //   // );
  // }

  render() {
    let bountyItems = null;
    if (this.state.bounties) {
      bountyItems = this.state.bounties.map(
        bounty => {
          return {
            id: bounty[0],
            publisher: bounty[1],
            bucketId: bounty[2],
            costPerToken: bounty[3],
            lastUpdated: bounty[4]
          }
        }
      );
    }

    return (
      <div className="Upload">
        <span className="Title">Create Bounty</span>
        <div className="Content">
          <div>
            <Dropzone
              onFilesAdded={this.onFilesAdded}
              disabled={this.state.uploading || this.state.successfulUploaded}
            />
          </div>
          <div className="Files">
            {this.state.files.map(file => {
              return (
                <div key={file.name} className="Row">
                  <span className="Filename">{file.name}</span>
                  {this.renderProgress(file)}
                </div>
              );
            })}
          </div>
        </div>
        <div className="Actions">{this.renderActions()}</div>
        {bountyItems ? <BountyTable rows={bountyItems} /> : null}
      </div>
    );
  }
}

export default Upload;
