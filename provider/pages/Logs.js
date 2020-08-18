import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  text: {
    fontFamily: "Monospace",
    wordBreak: "break-word",
    fontSize: 20,
  },
  log: {
    color: "white",
  },
  error: {
    color: "red",
  },
});

export default function Logs({ logs }) {
  const classes = useStyles();
  return (
    <React.Fragment>
      {logs.map((log, i) => {
        const { msg, isError } = log;
        const className = clsx(
          classes.text,
          isError ? classes.error : classes.log
        );
        return (
          <span key={i} className={className}>
            {msg}
          </span>
        );
      })}
    </React.Fragment>
  );
}
