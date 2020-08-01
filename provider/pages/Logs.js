import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  text: {
    color: 'rgb(255, 255, 255)',
    fontFamily: 'Monospace',
  }
});

export default function Logs({ logs }) {
  const classes = useStyles();
  return (
    <React.Fragment>
      {logs.map((log, i) => (
        <span key={i} className={classes.text}>{log}</span>
      ))}
    </React.Fragment>
  );
}
