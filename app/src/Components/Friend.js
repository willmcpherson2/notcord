import { React, Component } from 'react';
import { Button, Form, Col, Modal, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { GearIcon, PersonAddIcon } from '@primer/octicons-react';
import Peer from 'simple-peer';
import '../App.css'

//Sounds
import join from '../Sounds/join.mp3'
import leave from '../Sounds/leave.mp3'


let reRender = null;
let peerUpdate = null;
let currentUser = null;
let isAdmin = false;

export default class Friend extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      invite: '',
      channels: [],
      inviteShow: false,
      channelShow: false,
      settingsShow: false,
      groupShow: false,
      messages: [],
      currentMessage: '',
      currentChannel: '',
      usersInChannel: [],
      users: [],
      leaveGroupShow: false,
      deleteChannelShow: false,
      showAlert: false,
      alertMessage: '',
      success: false,
      inVoiceChat: false,
      voiceStream: null,
      voicePeers: {},
      audioPlayers: [],
      currentVoiceChannel: '',
      userAvatars: [],
      friend: '',
      currentUser: '',
    }
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
    return user
  }

  async isGroupAdmin() {
    const username = await this.getUsername();
    const data = await fetch(process.env.REACT_APP_API_URL + '/is_group_admin', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: username,
        group_name: this.props.groupName
      })
    })
    const user = await data.json()
    if (user === "Ok") {
      return true;
    } else {
      return false;
    }
  }
  async getChannels() {
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_friends_for_user', {
      method: 'POST',
      credentials: 'include',
    })
    const channels = await data.json();
    await this.setState({ channels: [...channels] })
    await this.setState({ currentChannel: this.state.channels[0] })
    this.renderMessages(this.state.currentChannel)
  }

  //This is used on the first load of the component. When the user 'activates' it. It is used only 1 time during load.
  async componentDidMount() {
    this.getChannels();
    this.constantRender();
    this.scrollToBottom();
    const username = await this.getUsername();
    this.setState({ currentUser: username})
    this.isAdmin = await this.isGroupAdmin();
  }

  //This is used every single time the props 'groupName' is updated, so whent the group changes
  componentDidUpdate(prevProps, prevState) {
    //Checks the groupName current to the previous one last update, if they are not the same, then get the new channels for this new group.
    if (this.props.groupName !== prevProps.groupName) {
      //Fetches the channels and assigns them to the 'channels' array state.
      this.getChannels();
      if (this.state.currentChannel !== null) {
        console.log(this.state.currentChannel)
        this.renderMessages(this.state.currentChannel);
      }
    }
    if (this.state.messages.length !== prevState.messages.length) {
      this.scrollToBottom();
    }
  }

  //Renders the channels to be mapped out to individual buttons using rows and buttons.... this should probably not be using Rows due to some weird bugs
  renderChannels() {
    return (
      this.state.channels.map((val, key) => {
        return (
          <div key={key}>
            <button
              className={this.state.currentChannel === val ? 'channelBar selected' : 'channelBar'}
              onClick={() => {
                this.setState({ currentChannel: val },
                  () => this.renderMessages(val))
              }}>{val}</button>
          </div>
        )
      })
    )
  }

  scrollToBottom() {
    const scrollHeight = this.messageList.scrollHeight;
    const height = this.messageList.clientHeight;
    const maxScrollTop = scrollHeight - height;
    this.messageList.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  }

  async renderMessages(channel) {
    try {
      const data = await fetch(process.env.REACT_APP_API_URL + '/get_friend_messages', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(this.state.currentChannel)
      })
      const messages = await data.json()
      this.setState({ messages: messages })
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
          console.log(this.state.currentUser)
          return (
            <div key={key}>
              <p className={this.state.currentUser === val.username ? "messageTitle currentUser" : "messageTitle"}>{val.username}<span>{date}</span></p>
              <p className="messageContent">{val.message}</p>
            </div>

          )
        })
      )
    } catch (error) {
    }

  }
  //This rerenders the chat box so messages are displayed. It's quite nice.
  constantRender() {
    reRender = setInterval(() => {
      this.renderMessages(this.state.currentChannel)
      this.renderItems();
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(reRender);
    this.leaveVoice();
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
        friend: this.state.currentChannel,
        message: this.state.currentMessage
      })
    })

    this.renderMessages(this.state.currentChannel)
    this.setState({ currentMessage: '' })
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

  handleNameChange = (e) => {
    this.setState({ name: e.target.value })
  }
  handleInviteChange = (e) => {
    this.setState({ friend: e.target.value })
  }
  handleMessageChange = (e) => {
    this.setState({ currentMessage: e.target.value })
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
    window.location.reload();
  }

  alert() {
    return (
      <Alert variant={this.state.success ? 'success' : 'danger'} onClose={() => this.setState({ showAlert: false })} dismissible>
        {this.state.alertMessage}
      </Alert>
    );
  }

  joinVoice = async () => {
    const audioEl = document.getElementsByClassName("audio-element")[0]
    audioEl.play()
    this.getUserAvatars();
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
        user2: this.state.currentChannel,
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
          user2: this.state.currentChannel,
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
          user2: this.state.currentChannel,
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
          user2: this.state.currentChannel,
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

    const index = this.currentUser;
    delete this.state.userAvatars[index];

    await fetch(process.env.REACT_APP_API_URL + '/leave_voice', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user1: this.state.currentUser,
        user2: this.state.currentChannel,
      }),
    });
  }

  render() {
    return (
      <div className="group">
        <audio className="audio-element">
          <source src={join}></source>
        </audio>
        <audio className="audio-element-leave">
          <source src={leave}></source>
        </audio>
        {/**NAVIGATION BAR */}

        {/**Invite people to group */}
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
              <Button onClick={this.addFriend}>Send Request</Button>
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

        {/**Leave Group Confirm */}
        <Modal show={this.state.leaveGroupShow} onHide={() => { this.setState({ leaveGroupShow: false, showAlert: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Remove Friend</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to remove this friend? This action is unreversable. You will need to add friend again to reconnect.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={this.removeFriend}>Delete Friend</Button>
          </Modal.Footer>
        </Modal>

        <div className="navigation">
          <div className="heading">
              <h3 className="groupName">Friends</h3>

            <OverlayTrigger
              placement='right'
              delay={{ show: 500, hide: 0 }}
              overlay={<Tooltip>Friend Requests</Tooltip>}>
              <button className="invite" onClick={() => { this.setState({ requestsShow: true }) }}><PersonAddIcon size={24} /></button>
            </OverlayTrigger>
          </div>


          <div className="channels">
            {this.renderChannels()}
          </div>
          <div className="extras">
            <Button onClick={() => { this.setState({ inviteShow: true }) }} variant="light">Add Friend</Button>
            <Button className="leaveGroup" onClick={() => { this.setState({ leaveGroupShow: true }) }} variant="danger">Remove Friend</Button>
          </div>

        </div>

        <div className="messageArea">
          <div className="infoBox">
            <div className="info"><p>{this.state.currentChannel}</p></div>
            <div className="callButton">
              <Button variant="success" className={this.state.inVoiceChat ? "noDisplay" : ""} onClick={this.joinVoice}>Join Voice Call</Button>
              <Button variant="danger" className={this.state.inVoiceChat ? "" : "noDisplay"} onClick={this.leaveVoice}>Leave Call</Button>
            </div>


          </div>
          <div className="messages" ref={(div) => { this.messageList = div; }}>{this.renderItems()}</div>
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
