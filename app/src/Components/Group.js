import { React, Component } from 'react';
import { Button, Container, Form, Row, Col, Modal } from 'react-bootstrap';
import '../App.css'
export default class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: 'boop',
      channels: [],
      show: false
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
    if (this.props.groupName !== prevProps.groupName){
      //Fetches the channels and assigns them to the 'channels' array state.
      fetch(process.env.REACT_APP_API_URL + '/get_channels_in_group', { method: 'POST', credentials: 'include', body: JSON.stringify(this.props.groupName) })
        .then(res => res.json())
        .then(res => {
          console.log(res)
          this.setState({ channels: [...res] })
        });
    }
  }

  //Renders the channels to be mapped out to individual buttons using rows and buttons.... this should probably not be using Rows due to some weird bugs
  // FIXME: Remove rows because of bootstrap react bug with sidebars and div heights
  renderChannels() {
    return (
      this.state.channels.map((val, key) => {
        return (
          <Row key={key} className="max">
            <Button className="groupButton" variant="link" onClick={() => { this.handleSubmit(val) }}>{val}</Button>
          </Row>
        )
      })
    )
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
        // TODO: Set this to not change the location but update the channels correctly


        fetch(process.env.REACT_APP_API_URL + '/get_channels_in_group', { method: 'POST', credentials: 'include', body: JSON.stringify(this.props.groupName) })
          .then(res => res.json())
          .then(res => {
            console.log(res)
            this.setState({ channels: [...res] })
          });

      } else if (res === "ChannelAlreadyExists") {
        console.log("CHANNEL ALREADY EXISTS")
        // TODO: create bootstrap alert for this
      } else {
        console.log(res)
      }
    })

  }

  handleNameChange = (e) => {
    this.setState({ name: e.target.value })
  }


  render() {
    return (
      <div>
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
                <h1>{this.props.groupName}</h1>
              {this.renderChannels()}
                <Button onClick={() => { this.setState({ show: true }) }} variant="light">New Channel</Button>

                </div>
    );
  }
}
