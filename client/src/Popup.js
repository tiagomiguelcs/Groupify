import React, {Component} from 'react';
import {Dialog, DialogTitle, DialogContent} from '@mui/material';

export default class Popup extends Component{
  render(){
    return(
    <React.Fragment>
        {this.props.children ?
        <Dialog {...this.props} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
          {this.props.title ? <DialogTitle id="alert-dialog-title">{this.props.title}</DialogTitle> : null}
          <DialogContent>{this.props.children}</DialogContent>
        </Dialog> : null}
    </React.Fragment>
    )
    ;
  }
}


