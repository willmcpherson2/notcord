import { Component } from 'react';
import { Button, Container, Row, OverlayTrigger, Tooltip, Modal, Form } from 'react-bootstrap';
import '../App.css'
import Logo from '../notcord.png'
import {GearIcon, PlusIcon, SignOutIcon} from '@primer/octicons-react'

export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: [],
      show: false,
      name: ''
    }
  }

  componentDidMount() {
    fetch(process.env.REACT_APP_API_URL + '/get_groups_for_user', { method: 'POST', credentials: 'include' })
      .then(res => res.json())
      .then(res => {
        console.log(res)
        this.setState({ groups: [...res] })
      });
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
              <button className={`groupButton ${randomColour}`} onClick={() => { this.handleSubmit(val) }}>{letter}</button>
            </OverlayTrigger>

          </Row>
        )
      })
    )
  }

  handleSubmit = (e) => {
    this.props.group(e)
    this.props.setView("group")
  }

  dashboard = () => {
    this.props.setView("dashboard");
  }
  settings = () => {
    this.props.setView("settings");
  }

  handleNameChange = (e) => {
    this.setState({ name: e.target.value })
  }

  createGroup = () => {
    const { name } = this.state;

    //This will create the group when the backend is set up to do so
    fetch(process.env.REACT_APP_API_URL + '/add_group', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(name)
    }).then(res =>
      res.json()
    ).then(res => {
      console.log(res)
      // FEATURE: create bootstrap alert for these
      if (res === "Ok") {
        this.props.setView("dashboard")
      } else if (res === "GroupAlreadyExists") {
        console.log("GROUP ALREADY EXISTS")
      } else {
        console.log(res)
      }
    })
    this.setState({ show: false }, () => {
      fetch(process.env.REACT_APP_API_URL + '/get_groups_for_user', { method: 'POST', credentials: 'include' })
        .then(res => res.json())
        .then(res => {
          console.log(res)
          this.setState({ groups: [...res] })
          this.renderGroups();
        });
    })

  }

  logout = () => {
    fetch(process.env.REACT_APP_API_URL + '/logout', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    }).then(res =>
      res.json()
    ).then(res => {
      console.log(res)
      window.location.reload(true);
    })
  }

  render() {
    return (
      <Container fluid className="sidebar">
        <Modal show={this.state.show} onHide={() => { this.setState({ show: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Form>
              <Form.Group>
                <Form.Label>Group Name</Form.Label>
                <Form.Control type="text" onChange={this.handleNameChange} />
              </Form.Group>
              <Button onClick={this.createGroup}>Create Group</Button>
            </Form>

          </Modal.Body>
        </Modal>
        <img src={Logo} alt="Notcord Logo" className="image" onClick={this.dashboard}></img>
        <hr className="hozLine" />

        {/** // TODO: Fix the design of these 
         * 
        */}
        {this.renderGroups()}
        <Row>
          <button className="groupButton Settings" onClick={() => { this.setState({ show: true }) }}><PlusIcon size={24} /></button>
          <button className="groupButton Settings" onClick={this.settings}><GearIcon size={24} /></button>
          <button className="groupButton Settings bottom" onClick={this.logout}><SignOutIcon size={24} /></button>
        </Row>

      </Container>
    );
  }
}