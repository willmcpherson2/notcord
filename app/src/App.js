import { Container, Row, Col } from 'react-bootstrap';
import React, { Component } from 'react';
import Login from './Components/Login';
import Sidebar from './Components/Sidebar';
import Signup from './Components/Signup'
import Settings from './Components/Settings';
import Group from './Components/Group';
import './App.css';

export default class App extends Component {
  constructor(props) {
    super();
    this.state = {
      userLoggedIn: false,
      view: "login",
      group: ""
    }
  }

  async componentDidMount() {
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      credentials: 'include'
    })
    const username = data.json()
      if(username !== "NotLoggedIn"){
        this.setState({userLoggedIn: true})
      } else {
        console.log(username)
      }
  }

updateView = (view) => {
  this.setState({ view: view })
}

group = (group) => {
  this.setState({ group: group })
}

loggedIn = async (e) => {
  if (e) {
    await fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      credentials: 'include'
    })
    this.setState({ userLoggedIn: true })
  }

}
renderComponents() {
  const { view } = this.state

  if (this.state.userLoggedIn) {
    switch (view) {

      case "dashboard":
        return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group} /></Col><Col className="noRight"><Settings setView={this.updateView} /></Col></Row></Container>
      case "settings":
        return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group} /></Col><Col className="noRight"><Settings setView={this.updateView} /></Col></Row></Container>
      case "group":
        return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group} /></Col><Col className="noRight"><Group groupName={this.state.group} /></Col></Row></Container>
      default:
        return <Container fluid><Row><Col md="auto" className="sidebarPadding"><Sidebar setView={this.updateView} group={this.group} /></Col><Col className="noRight"><Settings setView={this.updateView} /></Col></Row></Container>
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
    <Container fluid className="App">
      {this.renderComponents()}
    </Container>
  );
}
}
