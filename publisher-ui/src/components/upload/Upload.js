import React, { Component } from "react";
import Dropzone from "../dropzone/Dropzone";
import "./Upload.css";
import Progress from "../progress/Progress";
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
    // TODO: don't hardcode this and expose a UI for the user to specify this
    let costPerToken = 1;

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
      //const res = (await Promise.all(promises))[0];
      const res = await this.sendBulkRequest(this.state.files);
      const copy = { ...this.state.uploadProgress }

      for (let i = 0; i < this.state.files.length; ++i) {
        const file = this.state.files[i];
        copy[file.name] = { state: 'done', percentage: 100 }
      }
      const bucketId = (await res.json()).bucketId;

      this.setState({ uploadProgress: copy });
      console.log(`Created bucket with id ${bucketId}`);
      this.createBounty(bucketId);
      this.setState({ successfulUploaded: true, uploading: false });
    } catch (e) {
      // Not Production ready! Do some error handling here instead...
      this.setState({ successfulUploaded: true, uploading: false });
    }
  }

  sendRequest(file) {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();

      req.upload.addEventListener("progress", event => {
        if (event.lengthComputable) {
          const copy = { ...this.state.uploadProgress };
          copy[file.name] = {
            state: "pending",
            percentage: (event.loaded / event.total) * 100
          };
          this.setState({ uploadProgress: copy });
        }
      });

      req.upload.addEventListener("load", event => {
        const copy = { ...this.state.uploadProgress };
        copy[file.name] = { state: "done", percentage: 100 };
        this.setState({ uploadProgress: copy });
        resolve(req.response);
      });

      req.upload.addEventListener("error", event => {
        const copy = { ...this.state.uploadProgress };
        copy[file.name] = { state: "error", percentage: 0 };
        this.setState({ uploadProgress: copy });
        reject(req.response);
      });

      const formData = new FormData();
      formData.append("file", file, file.name);

      req.open("POST", "http://localhost:3001/upload");
      req.setRequestHeader('Content-Type', 'application/json')
      req.send(JSON.stringify({
        files: [file.name]
      }));
    });
  }

  sendBulkRequest(files) {
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
            src="check.svg"
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
