import { React, Component } from 'react';
import { Button, Form, Row, Col, Modal } from 'react-bootstrap';
import { GearIcon } from '@primer/octicons-react';
import '../App.css'
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
      users: []

    }
  }

  //This is used on the first load of the component. When the user 'activates' it. It is used only 1 time during load.
  componentDidMount() {
    fetch(process.env.REACT_APP_API_URL + '/get_channels_in_group', { method: 'POST', credentials: 'include', body: JSON.stringify(this.props.groupName) })
      .then(res => res.json())
      .then(res => {
        this.setState({ channels: [...res] })
      });
  }

  //This is used every single time the props 'groupName' is updated, so whent the group changes
  componentDidUpdate(prevProps) {
    //Checks the groupName current to the previous one last update, if they are not the same, then get the new channels for this new group.
    if (this.props.groupName !== prevProps.groupName) {
      //Fetches the channels and assigns them to the 'channels' array state.
      fetch(process.env.REACT_APP_API_URL + '/get_channels_in_group', { method: 'POST', credentials: 'include', body: JSON.stringify(this.props.groupName) })
        .then(res => res.json())
        .then(res => {
          this.setState({ channels: [...res] })
        });

      if (this.state.currentChannel !== null) {
        this.renderMessages(this.state.currentChannel);
      }
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
              this.setState({ settingsShow: true, currentChannel: val }, () =>
              {
                fetch(process.env.REACT_APP_API_URL + '/get_users_in_channel', {
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
              }).then(res =>
                res.json()
              ).then(res => {
                this.setState({ usersInChannel: res })
              });
              this.renderUsers();
              })
              
              }}><GearIcon size={16} /></button>
          </div>
        )
      })
    )
  }

  renderMessages(channel) {
    fetch(process.env.REACT_APP_API_URL + '/get_messages', {
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
    }).then(res =>
      res.json()
    ).then(res => {
      this.setState({ messages: res })
    });
    //this.setState({ messages: [...res] })
    
  }


  createChannel = () => {
    const { name } = this.state;

    //This creates the channel
    fetch(process.env.REACT_APP_API_URL + '/add_channel_to_group', {
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
    }).then(res =>
      res.json()
    ).then(res => {
      if (res === "Ok") {
        fetch(process.env.REACT_APP_API_URL + '/get_channels_in_group', { method: 'POST', credentials: 'include', body: JSON.stringify(this.props.groupName) })
          .then(res => res.json())
          .then(res => {
            console.log(res)
            this.setState({ channels: [...res] })
          });

      } else if (res === "ChannelAlreadyExists") {
        console.log("CHANNEL ALREADY EXISTS")
        // FEATURE: create bootstrap alert for this
      } else {
        console.log(res)
      }
    })

  }

  inviteUser = () => {
    //This invites users
    fetch(process.env.REACT_APP_API_URL + '/invite_user_to_group', {
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
    }).then(res =>
      res.json()
    ).then(res => {

      //TODO: Convert all of these in the program with "switch" statements for all the errors as directed in the API Documentation
      if (res === "Ok") {
        console.log("USER " + this.state.invite + " INVITED")
      } else if (res === "ChannelAlreadyExists") {
        console.log("CHANNEL ALREADY EXISTS")
        // FEATURE: create bootstrap alert for this
      } else {
        console.log(res)
      }
    })
  }

  sendMessage = (e) => {
    fetch(process.env.REACT_APP_API_URL + '/send_message', {
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
    }).then(res =>
      res.json()
    ).then(res => {
      console.log(res)
      //FIXME: This should be automatically rendered by the database pinging the client to reload
      this.renderMessages(this.state.currentChannel)
      this.setState({ currentMessage: ''})
    })
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

  renderUsers() {
    fetch(process.env.REACT_APP_API_URL + '/get_users_in_group', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(this.props.groupName)
    }).then(res =>
      res.json()
    ).then(res => {
      this.setState({ users: [...res] })
    });
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

  savePermissions = () => {
    this.state.users.forEach(user => {
      if(document.getElementById(user).checked){
        fetch(process.env.REACT_APP_API_URL + '/add_user_to_channel', {
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
        }).then(res =>
          res.json()
        ).then(res => {
          console.log(user + " add to the channel")
          this.setState({ settingsShow: false })
        });
      }
    });
  }

  renderItems() {
    try {
      return (
        this.state.messages.map((val, key) => {
          const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          let time = new Date(val.time + " UTC");
          let date = time.getDay() + " " + monthNames[time.getMonth()] + " " + time.getFullYear() + " - " + time.getHours() + ":" + time.getMinutes()
          return (
            <p key={key}><span>({date})</span> {val.username}: {val.message}</p>
          )
        })
      )
    } catch (error) {
      console.log(error);
    }

  }


  render() {
    return (
      <div className="group">
        {/**NAVIGATION BAR */}

        {/**Change Channel Settings */}
        <Modal show={this.state.settingsShow} onHide={() => { this.setState({ settingsShow: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Set Channel Permissions</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Form>
              <Form.Group>
                <Form.Label>Allow:</Form.Label>
                {this.renderUsersPermission()}
              </Form.Group>
              <Button onClick={this.savePermissions}>Save Permissions</Button>
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
        <Modal show={this.state.inviteShow} onHide={() => { this.setState({ inviteShow: false }) }}>
          <Modal.Header closeButton>
            <Modal.Title>Invite People</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Form>
              <Form.Group>
                <Form.Label>Invite by Username</Form.Label>
                <Form.Control type="text" onChange={this.handleInviteChange} />
              </Form.Group>
              <Button onClick={this.inviteUser}>Invite User</Button>
            </Form>

          </Modal.Body>
        </Modal>
        {/* // using className "navbar" completely destroys all the CSS so navigation must be used instead.*/}
        <Row>
          <Col sm={3} className="navigation">
            <h1>{this.props.groupName}<Button onClick={() => { this.setState({ inviteShow: true }) }} variant="info" >Invite +</Button></h1>

            {this.renderChannels()}
            <Button onClick={() => { this.setState({ channelShow: true }) }} variant="light">New Channel</Button>
          </Col>
          <Col md='auto' sm>
            <h1>Messages:</h1>
            <div>{this.renderItems()}</div>
            <Form>
              <Form.Group controlId="formMessage">
                <Form.Control type="text" placeholder="message" value={this.state.currentMessage} onChange={this.handleMessageChange}></Form.Control>
              </Form.Group>
              <Col className="justify-content-md-center"><Button varient="primary" onClick={this.sendMessage}>Send Message</Button></Col>
            </Form>
          </Col>
        </Row>



      </div>
    );
  }
}
