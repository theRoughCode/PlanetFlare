import React, { Component } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import './BountyTable.css';


function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

class BountyTable extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <TableContainer component={Paper}>
        <Table className="table" aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Bounty ID</TableCell>
              <TableCell align="right">Publisher</TableCell>
              <TableCell align="right">Bucket ID</TableCell>
              <TableCell align="right">Cost Per Token</TableCell>
              <TableCell align="right">Last Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.props.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell component="th" scope="row"
                               style={{
                      whiteSpace: "normal",
                      wordWrap: "break-word"
                    }}>
                  {row.id}
                </TableCell>
                <TableCell align="right">{row.publisher}</TableCell>
                <TableCell align="right">{row.bucketId}</TableCell>
                <TableCell align="right">{row.costPerToken}</TableCell>
                <TableCell align="right">{row.lastUpdated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
}

export default BountyTable;
