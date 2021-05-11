import { React, Component } from 'react';
import { Button, Container, Row, Modal, Form, Alert } from 'react-bootstrap';
import '../App.css'
export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: 'default',
      inviteShow: false,
      invites: [],
      selectedFile: null,
      success: false,
      showAlert: false,
      alertMessage: ''
    }
  }

  async componentDidMount() {
    //This gets the avatar
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify()
    })
    const username = await data.json()
    this.setState({ username: username })
    this.getInvites();
    this.renderAvatar();
  }

  async getInvites() {
    //This gets the invitations
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_invites', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify("Group1")
    })
    const invites = await data.json()
    this.setState({ invites: invites })
  }

  async acceptInvite(group) {
    //This invites users
    const data = await fetch(process.env.REACT_APP_API_URL + '/accept_invite', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(group.toString())
    })
    const accept = data.json();
    if (accept === "Ok") {
      console.log("INVITE ACCEPTED")
      this.getInvites()
      this.setState({
        alertMessage: "Invitation Accepted",
        showAlert: true,
        success: true,
      })
    } else {
      console.log(accept)
      this.setState({
        alertMessage: accept,
        showAlert: true,
        success: false,
      })
    }
  }

  renderInvites() {
    try {
      return (
        this.state.invites.map((val, key) => {
          return (
            <div key={key}>{val}  <Button variant="success" onClick={() => { this.acceptInvite(val) }}>Accept</Button> <Button variant="danger">Decline (Not Implemented)</Button></div>
          )
        })
      )
    } catch (error) {
      console.log(error);
    }
  }

  async renderAvatar() {
    //This gets the avatar
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(this.state.username)
    })
    const image = await data.blob()
    const urlCreator = window.URL || window.webkitURL;
    const url = urlCreator.createObjectURL(image);
    const avatar = document.getElementById('avatar');
    avatar.src = url;
  }

  handleFileChange = (e) => {
    this.setState({ selectedFile: e.target.files[0] })

  }

  async newAvatar() {
    //This sets the avatar
    await fetch(process.env.REACT_APP_API_URL + '/set_avatar', {
      method: 'POST',
      headers: {
        'Accept': 'image/png',
        'Content-Type': 'image/png'
      },
      credentials: 'include',
      body: this.state.selectedFile
    })
    this.renderAvatar();
  }

  alert() {
    return (
      <Alert variant={this.state.success ? 'success' : 'danger'} onClose={() => this.setState({ showAlert: false })} dismissible>
        {this.state.alertMessage}
      </Alert>
    );
  }

  render() {
    return (
      <Container className='settings topPad'>
        <Modal show={this.state.inviteShow} onHide={() => { this.setState({ inviteShow: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Invitations</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.renderInvites()}
          </Modal.Body>
        </Modal>

        <Row className="justify-content-md-center">
          <h2>Settings</h2>

        </Row>
        <Row>
          <Button onClick={() => {
            this.setState({ inviteShow: true })
            this.getInvites()
          }} variant="info">Invites</Button>
        </Row>
        <Row>
          <h1>Avatar:</h1>
          <img id="avatar" width="64" height="64" alt="Avatar"></img>
          <Form>
            <Form.Group>
              <Form.File id="setNewAvatar" label="Set New Avatar" onChange={this.handleFileChange} />
            </Form.Group>
            <Button variant="secondary" onClick={() => { this.newAvatar() }}>Save</Button>
          </Form>

        </Row>
      </Container>
    );
  }
}
