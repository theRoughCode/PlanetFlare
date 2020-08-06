import React from "react";
import List from "@material-ui/core/List";
import ListItemText from "@material-ui/core/ListItemText";
import Title from "./Title";

export default function Pinned({ pinned }) {

  return (
    <React.Fragment>
      <Title>Pinned Files</Title>
      <List>
        {pinned.map((cid, i) => (
          <ListItemText key={i} primary={cid} />
        ))}
      </List>
    </React.Fragment>
  );
}
