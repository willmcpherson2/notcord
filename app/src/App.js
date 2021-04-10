import { Container, Row, Col } from 'react-bootstrap';
import React, { Component } from 'react';
import Login from './Components/Login/Login';
import Sidebar from './Components/Sidebar/Sidebar';
import Signup from './Components/Signup/Signup'
import Settings from './Components/Settings/Settings';
import CreateNewGroup from './Components/Group/CreateNewGroup';

export default class App extends Component {
  constructor(props) {
    super();
    this.state = {
      userLoggedIn: false,
      view: "login"
    }
  }

  updateView = (view) => {
    this.setState({ view: view })
  }

  renderComponents() {
    const { view } = this.state
    if (!this.state.userLoggedIn) {
      switch (view) {
        case "login":
          return <Login setView={this.updateView} />
        case "signup":
          return <Signup setView={this.updateView} />
        case "dashboard":
          return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} /></Col><Col><Settings setView={this.updateView} /></Col></Row></Container>
        case "createNewGroup":
          return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} /></Col><Col><CreateNewGroup setView={this.updateView} /></Col></Row></Container>
        default:
          return <Login setView={this.updateView} /> 
      }

    } else {
      return <Sidebar setView={this.updateView} />
    }
  }

  render() {
    return (
      <Container fluid>
        {this.renderComponents()}
      </Container>
    );
  }
}
