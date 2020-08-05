import React from 'react';

class BountyItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            id: props.id,
            publisher: props.publisher,
            bucketID: props.bucketID,
            costPerToken: props.costPerToken,
            lastUpdated: props.lastUpdated
        }
    }

    render() {
        return (
            <p className="bountyItem">{this.state.id}, {this.state.publisher}, {this.state.bucketID}, {this.state.costPerToken}, {this.state.lastUpdated}</p>
        )
    }
}

export default BountyItem;
