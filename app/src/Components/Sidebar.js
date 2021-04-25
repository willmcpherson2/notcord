import { Component } from 'react';
import {Button, Container} from 'react-bootstrap';
import '../App.css'
import Logo from '../notcord.png'
import CreateNewGroup from './CreateNewGroup';

export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: []
    }
  }

  componentDidMount() {
    fetch(process.env.REACT_APP_API_URL + '/get_groups_for_user', {method: 'POST', credentials: 'include'})
    .then(res => res.json())
    .then(res => {
      console.log(res)
    });
  }

  dashboard = () => {
    this.props.setView("dashboard");
  }
  settings = () => {
    this.props.setView("settings");
  }
  createGroup = () => {
    this.props.setView("createNewGroup");
  }

  render() {  
  return (
      <Container fluid className="sidebar">
          <img src={Logo} alt="Notcord Logo" className="image" onClick={this.dashboard}></img>
          <hr className="hozLine"/>

          {/**This group of buttons will be dynamic depending on the groups */}
          <Button>Group 1</Button>
          <Button>Group 2</Button>



          <Button onClick={this.createGroup}>Create New Group</Button>
          <Button onClick={this.settings}>Settings</Button>
      </Container>
    );
  }
}