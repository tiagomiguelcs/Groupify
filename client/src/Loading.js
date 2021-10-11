import React, {Component} from 'react';
import {Backdrop, CircularProgress} from '@mui/material';

export default class Loading extends Component{
  render(){
    return(
      <Backdrop style={{zIndex: 200, color: "#fff"}} open={this.props.open}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }
}