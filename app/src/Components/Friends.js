import { React, Component } from 'react';
import { Button, Container, Row, Modal, Form, Alert, OverlayTrigger, Tooltip, Col } from 'react-bootstrap';
import { PlusIcon } from '@primer/octicons-react';
import Peer from 'simple-peer';
import '../App.css'

//Sounds
import join from '../Sounds/join.mp3'
import leave from '../Sounds/leave.mp3'

let peerUpdate = null;
export default class Friends extends Component {
  constructor(props) {
    super(props);
    this.state = {
      success: false,
      showAlert: false,
      alertMessage: '',
      inviteShow: false,
      friend: '',
      requestsShow: false,
      requests: [],
      friends: [],
      messages: [],
      currentFriend: '',
      currentMessage: '',
      inVoiceChat: false,
      voiceStream: null,
      voicePeers: {},
      audioPlayers: [],
    }
  }

  async componentDidMount() {
    this.getRequests();
    this.getFriends();
    await this.getUsername();
  }

  async getUsername() {
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })
    const user = await data.json()
    this.setState({ currentUser: user })
  }

  async getRequests() {
    //This gets the invitations
    // FIXME: Get friend requests
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_friend_requests', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    const invites = await data.json()
    this.setState({ requests: invites })
    console.log(this.state.requests)
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
      //this.getInvites()
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
    this.setState({ friends: friends })
  }

  //Renders the channels to be mapped out to individual buttons using rows and buttons.... this should probably not be using Rows due to some weird bugs
  renderFriends() {
    return (
      this.state.friends.map((val, key) => {
        return (
          <div key={key}>
            <button
              className={this.state.currentFriend === val ? 'channelBar selected' : 'channelBar'}
              onClick={() => {
                this.setState({ currentFriend: val },
                  () => this.renderMessages(val))
              }}>{val}</button>

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

  async renderMessages(friend) {
    try {
      const data = await fetch(process.env.REACT_APP_API_URL + '/get_friend_messages', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(friend)
      })
      const messages = await data.json()
      this.setState({ messages: messages })
      console.log(messages)
    } catch (e) {
      console.log(e);
    }
  }

  renderItems() {
    try {
      return (
        this.state.messages.map((val, key) => {
          const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          let time = new Date(val.time + " UTC");
          let date = time.getDate() + " " + monthNames[time.getMonth()] + " " + time.getFullYear() + " at " + time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes()
          let currentDate = new Date();
          if (currentDate.getDate() === time.getDate()) {
            date = "Today at " + time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes()
          } else if (currentDate.getDate() === time.getDate() + 1 || (currentDate.getDate() != 1 && time.getDate() === 1)) {
            date = "Yesterday at " + time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes()
          }
          return (
            <div key={key}>
              {/*<p className={this.currentUser === val.username ? "messageTitle currentUser" : "messageTitle"}>{val.username}<span>{date}</span></p>*/}
              <p className="messageTitle">{val.username}<span>{date}</span></p>
              <p className="messageContent">{val.message}</p>
            </div>

          )
        })
      )
    } catch (error) {
    }

  }

  sendMessage = async (e) => {
    e.preventDefault();
    await fetch(process.env.REACT_APP_API_URL + '/send_friend_message', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        friend: this.state.currentFriend,
        message: this.state.currentMessage
      })
    })

    this.renderMessages(this.state.currentFriend)
    this.setState({ currentMessage: '' })
  }

  handleMessageChange = (e) => {
    this.setState({ currentMessage: e.target.value })
    console.log(this.state.currentFriend)
  }



  joinVoice = async () => {
    const audioEl = document.getElementsByClassName("audio-element")[0]
    audioEl.play()
    //this.getUserAvatars();
    this.setState({
      inVoiceChat: true,
      voiceStream: await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      }),
    });

    await fetch(process.env.REACT_APP_API_URL + '/join_voice', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user1: this.state.currentUser,
        user2: this.state.currentFriend,
      }),
    });
    try {
      await this.getPeers(true);

      peerUpdate = setInterval(async () => {
        await this.getPeers(false);
        await this.getSignals();
      }, 1000);
    } catch (e) { console.log(e) }

  }

  async getPeers(isInitiator) {
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + '/get_peers', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user1: this.state.currentUser,
          user2: this.state.currentFriend,
        }),
      });

      const peerIds = await response.json();

      this.setState({
        voicePeers: Object.fromEntries(Object.entries(this.state.voicePeers).filter(([key, _]) => peerIds.includes(parseInt(key)))),
      });

      peerIds.forEach(peerId => {
        if (this.state.voicePeers[peerId] === undefined) {
          const peer = new Peer({ initiator: isInitiator, stream: this.state.voiceStream });
          peer.on('signal', signal => this.sendSignal(signal, peerId));
          peer.on('track', (_, peerStream) => this.addAudioPlayer(peerStream));
          this.state.voicePeers[peerId] = peer;
        }
      });
    } catch (e) { console.log(e) }

  }

  async getSignals() {
    try {
      const response = await fetch(process.env.REACT_APP_API_URL + '/get_signals', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user1: this.state.currentUser,
          user2: this.state.currentFriend,
        }),
      });

      const peerSignals = await response.json();
      peerSignals.forEach(signal => {
        this.state.voicePeers[signal.peer].signal(signal.signal);
      });
    } catch (e) { console.log(e) }

  }

  async sendSignal(signal, peerId) {
    await fetch(process.env.REACT_APP_API_URL + '/signal', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signal: JSON.stringify(signal), // Send object as string because we want to treat it opaquely.
        peer: peerId,
        channel_id: {
          user1: this.state.currentUser,
          user2: this.state.currentFriend,
        },
      }),
    });
  }

  addAudioPlayer(peerStream) {
    const player = document.createElement('audio');
    if ('srcObject' in player) {
      player.srcObject = peerStream;
    } else {
      player.src = window.URL.createObjectURL(peerStream); // For older browsers
    }
    player.play();
    this.state.audioPlayers.push(player);
  }

  leaveVoice = async () => {
    const audioEl = document.getElementsByClassName("audio-element-leave")[0]
    audioEl.play()
    clearInterval(peerUpdate);

    Object.values(this.state.voicePeers).forEach(peer => peer.destroy());

    this.setState({
      inVoiceChat: false,
      voiceStream: null,
      voicePeers: {},
      audioPlayers: [],
    });

    await fetch(process.env.REACT_APP_API_URL + '/leave_voice', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user1: this.state.currentUser,
        user2: this.state.currentFriend,
      }),
    });
  }

  removeFriend = async () => {
    //This invites users
    const data = await fetch(process.env.REACT_APP_API_URL + '/delete_friendship', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(this.state.currentFriend)
    })
    const invites = await data.json()
    if (invites === "Ok") {
      this.getFriends();
      this.setState({
        alertMessage: "User " + this.state.currentFriend + " Removed as Friend",
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

  render() {
    return (
      <div>
        <audio className="audio-element">
          <source src={join}></source>
        </audio>
        <audio className="audio-element-leave">
          <source src={leave}></source>
        </audio>
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
            {this.renderFriends()}
          </div>



          <div className="extras">
            <Button variant="danger" className={this.state.currentFriend === null ? "noDisplay" : ""} onClick={this.removeFriend}>Remove Friend</Button>
          </div>

        </div>

        <div className="messageArea">
          <div className="infoBox">
            <div className="info"><p>{this.state.currentFriend}</p></div>



            <div className={this.state.currentFriend === null ? "noDisplay" : "callButton"}>
              <Button variant="success" className={this.state.inVoiceChat ? "noDisplay" : ""} onClick={this.joinVoice}>Join Voice Call</Button>
              <Button variant="danger" className={this.state.inVoiceChat ? "" : "noDisplay"} onClick={this.leaveVoice}>Leave Call</Button>
            </div>


          </div>



          <div className="messages">{this.renderItems()}</div>
          <div className="messageBox">
            <Form onSubmit={this.sendMessage}>
              <Form.Row>
                <Col>
                  <Form.Control type="text" autoComplete="off" placeholder="message" value={this.state.currentMessage} onChange={this.handleMessageChange}></Form.Control>
                </Col>
                <Col md="auto">
                  <Button varient="primary" type="submit">Send Message</Button>
                </Col>
              </Form.Row>

            </Form>
          </div>


        </div>
      </div>
    );
  }
}
