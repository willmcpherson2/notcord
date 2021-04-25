import { Container, Row, Col } from 'react-bootstrap';
import React, { Component } from 'react';
import Login from './Components/Login';
import Sidebar from './Components/Sidebar';
import Signup from './Components/Signup'
import Settings from './Components/Settings';
import CreateNewGroup from './Components/CreateNewGroup';
import Group from './Components/Group';

export default class App extends Component {
  constructor(props) {
    super();
    this.state = {
      userLoggedIn: false,
      view: "login",
      group: ""
    }
  }

  updateView = (view) => {
    this.setState({ view: view })
  }

  group = (group) => {
    this.setState({ group: group})
  }

  // TODO: Remove the login and signup pages from this app, so as to simplify
  renderComponents() {
    const { view } = this.state
    if (!this.state.userLoggedIn) {
      switch (view) {
        case "login":
          return <Login setView={this.updateView} />
        case "signup":
          return <Signup setView={this.updateView} />
        case "dashboard":
          return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group}/></Col><Col><Settings setView={this.updateView} /></Col></Row></Container>
        case "createNewGroup":
          return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group}/></Col><Col><CreateNewGroup setView={this.updateView} /></Col></Row></Container>
        case "settings":
          return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group}/></Col><Col><Settings setView={this.updateView} /></Col></Row></Container>
        case "group":
          return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group}/></Col><Col><Group group={this.state.group} /></Col></Row></Container>
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
