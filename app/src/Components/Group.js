import { React, Component, useEffect, useRef } from 'react';
import { Button, Form, Col, Modal, Alert } from 'react-bootstrap';
import { GearIcon } from '@primer/octicons-react';
import '../App.css'

let reRender = null;
export default class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      invite: '',
      channels: [],
      inviteShow: false,
      channelShow: false,
      settingsShow: false,
      messages: [],
      currentMessage: '',
      currentChannel: '',
      usersInChannel: [],
      users: [],
      leaveGroupShow: false,
      deleteChannelShow: false,
      showAlert: false,
      alertMessage: '',
      success: false
    }
  }

  async getChannels() {
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_channels_in_group', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(this.props.groupName)
    })
    const channels = await data.json();
    this.setState({ channels: [...channels] })
  }

  async getUsersInChannel() {
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_users_in_channel', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        channel_name: this.state.currentChannel,
        group_name: this.props.groupName
      })
    })
    const users = await data.json()
    this.setState({ usersInChannel: users })
  }

  //This is used on the first load of the component. When the user 'activates' it. It is used only 1 time during load.
  componentDidMount() {
    this.getChannels();
    this.constantRender();
    this.scrollToBottom();
  }

  //This is used every single time the props 'groupName' is updated, so whent the group changes
  componentDidUpdate(prevProps, prevState) {
    //Checks the groupName current to the previous one last update, if they are not the same, then get the new channels for this new group.
    if (this.props.groupName !== prevProps.groupName) {
      //Fetches the channels and assigns them to the 'channels' array state.
      this.getChannels();
      if (this.state.currentChannel !== null) {
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
          <div key={key} className="max">
            <button onClick={() => { this.setState({ currentChannel: val }, () => this.renderMessages(val)) }}>{val}</button>
            <button onClick={() => {
              this.setState({ settingsShow: true, currentChannel: val }, () => {
                this.getUsersInChannel()
                this.renderUsers();
              })

            }}><GearIcon size={16} /></button>
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
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_messages', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        channel_name: channel,
        group_name: this.props.groupName
      })
    })
    const messages = await data.json()
    this.setState({ messages: messages })
  }

  renderItems() {
    try {
      return (
        this.state.messages.map((val, key) => {
          const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          let time = new Date(val.time + " UTC");
          let date = time.getDay() + " " + monthNames[time.getMonth()] + " " + time.getFullYear() + " - " + time.getHours() + ":" + (time.getMinutes() < 10 ? '0' : '') + time.getMinutes()
          return (
            // TODO: Fix this to make it look good lol
            <p key={key}><span>({date})</span><strong>{val.username}</strong>: {val.message}</p>
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
  }
  createChannel = async () => {
    const { name } = this.state;

    //This creates the channel
    const data = await fetch(process.env.REACT_APP_API_URL + '/add_channel_to_group', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        channel_name: name,
        group_name: this.props.groupName
      })
    })
    const channel = await data.json()
    if (channel === "Ok") {
      this.getChannels();
      this.setState({ channelShow: false })
    } else {
      console.log(channel)
    }

  }
  inviteUser = async () => {
    //This invites users
    const data = await fetch(process.env.REACT_APP_API_URL + '/invite_user_to_group', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: this.state.invite,
        group_name: this.props.groupName
      })
    })
    const invites = await data.json()
    if (invites === "Ok") {
      this.setState({
        alertMessage: "User " + this.state.invite + " Successfully Invited",
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
  sendMessage = async (e) => {
    e.preventDefault();
    await fetch(process.env.REACT_APP_API_URL + '/send_message', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        group_name: this.props.groupName,
        channel_name: this.state.currentChannel,
        message: this.state.currentMessage
      })
    })
    this.renderMessages(this.state.currentChannel)
    this.setState({ currentMessage: '' })
  }
  renderUsersPermission() {
    try {
      return (
        this.state.users.map((val, key) => {
          if (this.state.usersInChannel[key] !== undefined) {
            return (
              <Form.Check key={key} id={val} type="checkbox" label={val} defaultChecked />
            )
          } else {
            return (
              <Form.Check key={key} id={val} type="checkbox" label={val} />
            )
          }
        })
      )
    } catch (error) {
      console.log(error);
    }

  }
  async renderUsers() {
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_users_in_group', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(this.props.groupName)
    })
    const users = await data.json()
    this.setState({ users: [...users] })
  }
  handleNameChange = (e) => {
    this.setState({ name: e.target.value })
  }
  handleInviteChange = (e) => {
    this.setState({ invite: e.target.value })
  }
  handleMessageChange = (e) => {
    this.setState({ currentMessage: e.target.value })
  }
  savePermissions = async () => {
    this.state.users.forEach(async user => {
      //If user is selected. This, will add them
      if (document.getElementById(user).checked) {
        const data = await fetch(process.env.REACT_APP_API_URL + '/add_user_to_channel', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: user,
            group_name: this.props.groupName,
            channel_name: this.state.currentChannel
          })
        })
        const users = await data.json()
        console.log(user + " " + users)
        this.setState({ settingsShow: false })
        //And this will remove them. 
        // BUG: This removes admins included, and can remove the person who made it, this should be validated at a later stage
      } else if (!document.getElementById(user).checked) {
        const data = await fetch(process.env.REACT_APP_API_URL + '/remove_user_from_channel', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: user,
            group_name: this.props.groupName,
            channel_name: this.state.currentChannel
          })
        })
        const users = await data.json()
        console.log(user + " " + users)
        this.setState({ settingsShow: false })
      }
    });
  }
  //TODO: Ensure at least 1 channel remains at all times.
  deleteChannel = async () => {
    await fetch(process.env.REACT_APP_API_URL + '/remove_channel_from_group', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        channel_name: this.state.currentChannel,
        group_name: this.props.groupName
      })
    })
    console.log(this.state.currentChannel + " Deleted")
    this.setState({ settingsShow: false, deleteChannelShow: false });
    this.getChannels();
  }
  leaveGroup = async () => {
    const data = await fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    const username = await data.json()
    await fetch(process.env.REACT_APP_API_URL + '/remove_user_from_group', {
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
    window.location.reload();
    // FIXME: Removing the admin means no admins are in this group now. fix permissions
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
      <div className="group">
        {/**NAVIGATION BAR */}

        {/**Change Channel Settings */}
        <Modal show={this.state.settingsShow} onHide={() => { this.setState({ settingsShow: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Channel Settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Form>
              <Form.Group>
                <Form.Label>Allow:</Form.Label>
                {this.renderUsersPermission()}
              </Form.Group>
              <Button onClick={this.savePermissions}>Save Permissions</Button><Button variant="danger" onClick={() => this.setState({ deleteChannelShow: true })}>Delete Channel</Button>
            </Form>

          </Modal.Body>
        </Modal>

        {/**Create New Channel */}
        <Modal show={this.state.channelShow} onHide={() => { this.setState({ channelShow: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Channel</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Form>
              <Form.Group>
                <Form.Label>Channel Name</Form.Label>
                <Form.Control type="text" onChange={this.handleNameChange} />
              </Form.Group>
              <Button onClick={this.createChannel}>Create Channel</Button>
            </Form>

          </Modal.Body>
        </Modal>


        {/**Invite people to group */}
        <Modal show={this.state.inviteShow} onHide={() => { this.setState({ inviteShow: false, showAlert: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Invite People</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className={this.state.showAlert ? 'justify-content-md-center' : 'noDisplay'}>{this.alert()}</div>

            <Form>
              <Form.Group>
                <Form.Label>Invite by Username (Case Sensitive)</Form.Label>
                <Form.Control type="text" onChange={this.handleInviteChange} />
              </Form.Group>
              <Button onClick={this.inviteUser}>Invite User</Button>
            </Form>

          </Modal.Body>
        </Modal>

        {/**Delete Channel Confirm */}
        <Modal show={this.state.deleteChannelShow} onHide={() => { this.setState({ deleteChannelShow: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Delete Channel</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete this channel? This action is unreversable.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={this.deleteChannel}>Delete Channel</Button>
          </Modal.Footer>
        </Modal>

        {/**Leave Group Confirm */}
        <Modal show={this.state.leaveGroupShow} onHide={() => { this.setState({ leaveGroupShow: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Leave Group</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to leave this group? This action is unreversable. You will need to be invited again to rejoin.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={this.leaveGroup}>Leave Group</Button>
          </Modal.Footer>
        </Modal>

        <div className="navigation">
          <h1>{this.props.groupName}<Button onClick={() => { this.setState({ inviteShow: true }) }} variant="info" >Invite +</Button></h1>
          {this.renderChannels()}
          <Button onClick={() => { this.setState({ channelShow: true }) }} variant="light">New Channel</Button>
          <Button onClick={() => { this.setState({ leaveGroupShow: true }) }} variant="danger">Leave Group</Button>
        </div>

        <div className="messageArea">
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
