import {Button, Container} from 'react-bootstrap';
import React, {Component} from 'react';
import Login from './Components/Login/Login';
import Sidebar from './Components/Sidebar/Sidebar';

export default class App extends Component {
  constructor(props){
    super();
    this.state = {
      userLoggedIn: false
    }
  }

  renderComponents() {
    if (!this.state.userLoggedIn) {
      return <Login/>
    } else {
      return <Sidebar/>
    }
    
    
  }


    render(){
    return (
      <Container fluid>
          {this.renderComponents()}
      </Container>
    );
  }
}
  