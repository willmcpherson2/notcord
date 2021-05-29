import { React, Component } from 'react';
import { Button, Container, Row, Modal, Form, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { PlusIcon } from '@primer/octicons-react';
import '../App.css'
export default class Friends extends Component {
  constructor(props) {
    super(props);
    this.state = {
      success: false,
      showAlert: false,
      alertMessage: '',
      inviteShow: false,
      friend: null,
      requestsShow: false,
      requests: [],
      friends: [],
    }
  }

  async componentDidMount() {
    this.getRequests();
    this.getFriends();
  }

  async getRequests() {
    //This gets the invitations
    // FIXME: Get friend requests
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_invites', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    const invites = await data.json()
    this.setState({ requests: invites })
  }

  alert() {
    return (
      <Alert variant={this.state.success ? 'success' : 'danger'} onClose={() => this.setState({ showAlert: false })} dismissible>
        {this.state.alertMessage}
      </Alert>
    );
  }

  handleInviteChange = (e) => {
    this.setState({ friend: e.target.value })
  }

  addFriend = async () => {
    //This invites users
    const data = await fetch(process.env.REACT_APP_API_URL + '/add_friend_request', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(this.state.friend)
    })
    const invites = await data.json()
    if (invites === "Ok") {
      this.setState({
        alertMessage: "User " + this.state.friend + " Added as Friend",
        showAlert: true,
        success: true,
      })
    } else {
      this.setState({
        alertMessage: invites,
        showAlert: true,
        success: false,
      })
    }
  }

  async acceptInvite(name, response) {
    //This invites users
    const data = await fetch(process.env.REACT_APP_API_URL + '/process_friend_request', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: name.toString(),
        response: response
      })
    })
    const accept = await data.json();
    if (accept === "Ok") {
      this.getInvites()
      const message = response ? "Accepted" : "Declined"
      this.setState({
        alertMessage: "Invitation to Group " + name.toString() + " " + message,
        showAlert: true,
        success: response,
      })
    } else {
      this.setState({
        alertMessage: accept,
        showAlert: true,
        success: false,
      })
    }
  }

  renderFriendRequests() {
    try {
      return (
        this.state.requests.map((val, key) => {
          return (
            <div key={key}>{val}  <Button variant="success" onClick={() => { this.acceptInvite(val, true) }}>Accept</Button>
              <Button variant="danger" onClick={() => { this.acceptInvite(val, false) }}>Decline</Button></div>
          )
        })
      )
    } catch (error) {
      console.log(error);
    }
  }

  async getFriends() {
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_friends_for_user', {
      method: 'POST',
      credentials: 'include',
    })
    const friends = await data.json();
    await this.setState({ friends: [...friends] })
  }

  //Renders the channels to be mapped out to individual buttons using rows and buttons.... this should probably not be using Rows due to some weird bugs
  renderFriends() {
    return (
      this.state.friends.map((val, key) => {
        return (
          <div key={key}>
            <button
              className={this.state.currentChannel === val ? 'channelBar selected' : 'channelBar'}
              onClick={() => {
                this.setState({ currentChannel: val },
                  () => this.renderMessages(val))
              }}># {val}</button>

            {/*<button className="channelOverlay" onClick={() => {
              this.setState({ settingsShow: true, currentChannel: val }, () => {
                this.getUsersInChannel()
                this.renderUsers();
              })

            }}><GearIcon size={24} /></button>*/}
          </div>
        )
      })
    )
  }

  render() {
    return (
      <div>
        {/**Add friends */}
        <Modal show={this.state.inviteShow} onHide={() => { this.setState({ inviteShow: false, showAlert: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Add Friend</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className={this.state.showAlert ? 'justify-content-md-center' : 'noDisplay'}>{this.alert()}</div>

            <Form>
              <Form.Group>
                <Form.Label>Add by Username (Case Sensitive)</Form.Label>
                <Form.Control type="text" onChange={this.handleInviteChange} />
              </Form.Group>
              <Button onClick={this.addFriend}>Add Friend</Button>
            </Form>

          </Modal.Body>
        </Modal>

        {/**Friend Requests */}
        <Modal show={this.state.requestsShow} onHide={() => { this.setState({ requestsShow: false, showAlert: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Friend Requests</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className={this.state.showAlert ? 'justify-content-md-center' : 'noDisplay'}>{this.alert()}</div>

            <Form>
              <Form.Group>
                {this.renderFriendRequests()}
                <Button variant="success" onClick={() => { this.acceptInvite("Terry", true) }}>Accept</Button>
              </Form.Group>
            </Form>

          </Modal.Body>
        </Modal>

        <div className="navigation">
          <div className="heading">
            <h3 className="groupName">Friends</h3>
            <OverlayTrigger
              placement='right'
              delay={{ show: 500, hide: 0 }}
              overlay={<Tooltip>Add Friend</Tooltip>}>
              <button className="invite" onClick={() => { this.setState({ inviteShow: true }) }}><PlusIcon size={24} /></button>
            </OverlayTrigger>
            <button className="invite" onClick={() => { this.setState({ requestsShow: true }) }}>Friend Requests</button>
          </div>
          


          <div className="extras">

          </div>

        </div>

        <div className="messageArea">
          <div className="infoBox">
            <div className="info"><p>Friends</p></div>
            <div className="callButton">
            </div>


          </div>



          <div className="messageBox">
          </div>


        </div>
      </div>
    );
  }
}
