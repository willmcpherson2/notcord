import { Component } from 'react';
import { Button, Container, Row, OverlayTrigger, Tooltip, Modal, Form, Alert } from 'react-bootstrap';
import '../App.css'
import Logo from '../notcord.png'
import { GearIcon, PlusIcon, SignOutIcon } from '@primer/octicons-react'

export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: [],
      show: false,
      name: '',
      alertMessage: '',
      showAlert: false
    }
  }

  async getGroups() {
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_groups_for_user', { method: 'POST', credentials: 'include' })
    const groups = await data.json();
    this.setState({ groups: [...groups] })
  }

  componentDidMount() {
    this.getGroups()
  }

  renderGroups() {
    return (
      this.state.groups.map((val, key) => {
        let letter = val.charAt(0);
        const renderTooltip = (props) => (
          <Tooltip id="button-tooltip" {...props}>
            {val}
          </Tooltip>
        );
        const colours = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
        let randomColour = colours[key % 6];
        return (
          <Row key={key}>
            <OverlayTrigger
              placement="right"
              delay={{ show: 10, hide: 0 }}
              overlay={renderTooltip}
            >
              <button className={`groupButton ${randomColour}`} onClick={() => {
                this.props.group(val)
                this.props.setView("group")
              }}>{letter}</button>
            </OverlayTrigger>
          </Row>
        )
      })
    )
  }


  createGroup = async () => {
    //Here we create a group and immediately create a channel "general"
    const { name } = this.state;
    const data = await fetch(process.env.REACT_APP_API_URL + '/add_group', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(name)
    })
    const newGroup = await data.json();
    if (newGroup === "Ok") {
      this.setState({ show: false });
    } else {
      console.log(newGroup)
      this.setState({ 
        alertMessage: "Group Already Exists",
        showAlert: true
       });
    }
    //This creates the channel
    await fetch(process.env.REACT_APP_API_URL + '/add_channel_to_group', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        channel_name: "General",
        group_name: name
      })
    })
    await this.props.group(name)
    this.props.setView("group")
    this.getGroups();
  }


  logout = async () => {
    const data = await fetch(process.env.REACT_APP_API_URL + '/logout', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
    const logout = await data.json();
    logout ? window.location.reload(true) : console.log(logout)
  }


  handleNameChange = (e) => {
    this.setState({ name: e.target.value })
  }

  alert() {
    return (
      <Alert variant='danger' onClose={() => this.setState({ showAlert: false })} dismissible>
        {this.state.alertMessage}
      </Alert>
    );
  }

  render() {
    return (
      <Container fluid className="sidebar">
        <Modal show={this.state.show} onHide={() => { this.setState({ show: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className={this.state.showAlert ? 'justify-content-md-center' : 'noDisplay'}>{this.alert()}</div>
            <Form>
              <Form.Group>
                <Form.Label>Group Name</Form.Label>
                <Form.Control type="text" onChange={this.handleNameChange} />
              </Form.Group>
              <Button onClick={this.createGroup}>Create Group</Button>
            </Form>
          </Modal.Body>
        </Modal>
        <img src={Logo} alt="Notcord Logo" className="image" onClick={() => this.props.setView("dashboard")}></img>
        <hr className="hozLine" />
        {this.renderGroups()}
        <Row>
          <button className="groupButton Settings" onClick={() => { this.setState({ show: true }) }}><PlusIcon size={24} /></button>
          <button className="groupButton Settings" onClick={() => this.props.setView("settings")}><GearIcon size={24} /></button>
          <button className="groupButton Settings bottom" onClick={this.logout}><SignOutIcon size={24} /></button>
        </Row>
      </Container>
    );
  }
}