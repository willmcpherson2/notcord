import { Component } from 'react';
import {Button, Container} from 'react-bootstrap';
import '../../App.css'
import Logo from '../../notcord.png'

export default class Sidebar extends Component {

  dashboard = () => {
    this.props.setView("dashboard");
  }
  settings = () => {
    this.props.setView("settings");
  }

  render() {  
  return (
      <Container fluid className="sidebar">
          <img src={Logo} alt="Notcord Logo" className="image" onClick={this.dashboard}></img>
          <hr className="hozLine"/>

          {/**This group of buttons will be dynamic depending on the groups */}
          <Button>Group 1</Button>
          <Button>Group 2</Button>



          <Button>Create New Group</Button>
          <Button onClick={this.Settings}>Settings</Button>
      </Container>
    );
  }
}