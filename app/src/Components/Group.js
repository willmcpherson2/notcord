import { React, Component } from 'react';
import { Button, Form, Row, Col, Modal } from 'react-bootstrap';
import '../App.css'
export default class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: null,
      channels: [],
      show: false,
      messages: [],
      currentMessage: null,
      currentChannel: null
    }
  }

  //This is used on the first load of the component. When the user 'activates' it. It is used only 1 time during load.
  componentDidMount() {
    fetch(process.env.REACT_APP_API_URL + '/get_channels_in_group', { method: 'POST', credentials: 'include', body: JSON.stringify(this.props.groupName) })
      .then(res => res.json())
      .then(res => {
        console.log(res)
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
          console.log(res)
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
      console.log(res)
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
      console.log(res)
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

  sendMessage = (e) => {
    console.log(this.state.currentMessage)
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
    })
  }

  handleNameChange = (e) => {
    this.setState({ name: e.target.value })
  }

  handleMessageChange = (e) => {
    this.setState({ currentMessage: e.target.value })
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
        <Modal show={this.state.show} onHide={() => { this.setState({ show: false }) }}>
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
        {/* // using className "navbar" completely destroys all the CSS so navigation must be used instead.*/}
        <Row>
          <Col sm={3} className="navigation"><h1>{this.props.groupName}</h1>
            {this.renderChannels()}
            <Button onClick={() => { this.setState({ show: true }) }} variant="light">New Channel</Button>
          </Col>
          <Col md='auto' sm>
            <h1>Messages:</h1>
            <div>{this.renderItems()}</div>

            <Form>
              <Form>
                <Form.Group controlId="formMessage">
                  <Form.Control type="text" placeholder="message" value={this.state.currentMessage} onChange={this.handleMessageChange}></Form.Control>
                </Form.Group>
                <Col className="justify-content-md-center"><Button varient="primary" onClick={this.sendMessage}>Send Message</Button></Col>
              </Form>
            </Form>
          </Col>
        </Row>



      </div>
    );
  }
}
