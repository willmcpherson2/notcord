import { Container, Row, Col } from 'react-bootstrap';
import React, { Component } from 'react';
import Login from './Components/Login';
import Sidebar from './Components/Sidebar';
import Signup from './Components/Signup'
import Settings from './Components/Settings';
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

  componentDidMount() {
    console.log("COMPONENT MOUNTING")
    fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      credentials: 'include'
    }).then(res =>
      res.json()
    ).then(res => {
      if(res != "NotLoggedIn"){
        console.log(res)
        this.setState({userLoggedIn: true})
      } else {
        console.log(res + "NOT WORKING")
      }
    })
  }

updateView = (view) => {
  this.setState({ view: view })
}

group = (group) => {
  this.setState({ group: group })
}

loggedIn = (e) => {
  if (e) {
    fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      credentials: 'include'
    }).then(res =>
      res.json()
    ).then(res => {
      this.setState({ userLoggedIn: true })
      console.log("Welcome back " + res)
    })
  }

}

// TODO: Remove the login and signup pages from this app, so as to simplify
renderComponents() {
  const { view } = this.state

  if (this.state.userLoggedIn) {
    switch (view) {

      case "dashboard":
        return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group} /></Col><Col><Settings setView={this.updateView} /></Col></Row></Container>
      case "settings":
        return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group} /></Col><Col><Settings setView={this.updateView} /></Col></Row></Container>
      case "group":
        return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group} /></Col><Col><Group group={this.state.group} /></Col></Row></Container>
      default:
        return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group} /></Col><Col><Settings setView={this.updateView} /></Col></Row></Container>
    }

  } else {
    switch (view) {
      case "login":
        return <Login setView={this.updateView} loggedIn={this.loggedIn}/>
      case "signup":
        return <Signup setView={this.updateView} />
      default:
        return <Login setView={this.updateView} loggedIn={this.loggedIn} />
    }
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
