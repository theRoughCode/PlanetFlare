import { Component } from "react";
import io from "socket.io-client";

class Main extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ipfsReady: false,
            peerId: '',
            ipfsLocation: '',
        };
    }

    componentDidMount() {
        this.socket = io();
        this.socketHandler();
    }

    socketHandler() {
        this.socket.on('status', ({ ready, peerId, location }) => {
            this.setState({ ipfsReady: ready, peerId, ipfsLocation: location  });
        });
    }

    render() {
        return (
            <div>
                <h1>
                    <b>Status:</b>
                    {
                        (this.state.ipfsReady)
                            ? 'Ready'
                            : 'Not ready'
                    }
                </h1>
                <div>
                    {
                        (this.state.ipfsReady) && (
                            <div>
                                <h2>Peer ID: { this.state.peerId }</h2>
                                <h2>Location: { this.state.ipfsLocation }</h2>
                            </div>
                        )
                    }
                </div>
            </div>
        );
    }
    
}

export default Main;
