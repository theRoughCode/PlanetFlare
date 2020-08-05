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
        <tr>
            <td>{this.state.id}</td>
            <td>{this.state.publisher}</td>
            <td>{this.state.bucketID}</td>
            <td>{this.state.costPerToken}</td>
        </tr>
        );
    }
}

export default BountyItem;
