import { React, Component } from 'react';
import { Button, Container, Row, Modal, Form } from 'react-bootstrap';
import '../App.css'
export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: 'default',
      inviteShow: false,
      invites: [],
      selectedFile: null
    }
  }

  acceptInvite(group) {
    //This invites users
    console.log(group)
    fetch(process.env.REACT_APP_API_URL + '/accept_invite', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(group.toString())
    }).then(res =>
      res.json()
    ).then(res => {

      //TODO: Convert all of these in the program with "switch" statements for all the errors as directed in the API Documentation
      if (res === "Ok") {
        console.log("INVITE ACCEPTED")
        this.getInvites()
        this.setState({ inviteShow: false })
      } else if (res === "ChannelAlreadyExists") {
        console.log("CHANNEL ALREADY EXISTS")
        // FEATURE: create bootstrap alert for this
      } else {
        console.log(res)
      }
    })
  }

  getInvites() {
    //This gets the invitations
    fetch(process.env.REACT_APP_API_URL + '/get_invites', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify("Group1")
    }).then(res =>
      res.json()
    ).then(res => {
      this.setState({ invites: res })
    })
  }

  componentDidMount() {
    //This gets the avatar
    fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify()
    }).then(res =>
      res.json()
    ).then(res => {
      this.setState({ username: res})
    })
    this.getInvites();
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

  renderAvatar() {
    //This gets the avatar
    fetch(process.env.REACT_APP_API_URL + '/get_avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(this.state.username)
    }).then(res =>
      res.blob()
    ).then(res => {
      const urlCreator = window.URL || window.webkitURL;
      const url = urlCreator.createObjectURL(res);
      const avatar = document.getElementById('avatar');
      avatar.src = url;
    })
  }

  handleFileChange = (e) => {
    this.setState({ selectedFile: e.target.files[0] })

  }

  newAvatar() {
    //This sets the avatar
    fetch(process.env.REACT_APP_API_URL + '/set_avatar', {
      method: 'POST',
      headers: {
        'Accept': 'image/png',
        'Content-Type': 'image/png'
      },
      credentials: 'include',
      body: this.state.selectedFile
    }).then(res => {
      console.log(res)
      this.renderAvatar()
    }
      
    )
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
          {this.renderAvatar()}
          <Form>
            <Form.Group>
              <Form.File id="setNewAvatar" label="Set New Avatar" onChange={this.handleFileChange}/>
            </Form.Group>
            <Button variant="secondary" onClick={() => {this.newAvatar()}}>Save</Button>
          </Form>
          
        </Row>
      </Container>
    );
  }
}
