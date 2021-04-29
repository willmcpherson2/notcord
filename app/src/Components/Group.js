import { React, Component } from 'react';
import { Button, Container, Form, Row, Col, Modal } from 'react-bootstrap';
import Logo from '../notcord.png';
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

  componentDidMount() {
    fetch(process.env.REACT_APP_API_URL + '/get_channels_in_group', { method: 'POST', credentials: 'include', body: JSON.stringify(this.props.group) })
      .then(res => res.json())
      .then(res => {
        console.log(res)
        this.setState({ channels: [...res] })
      });
  }

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
        group_name: this.props.group
      })
    }).then(res =>
      res.json()
    ).then(res => {
      console.log(res)
      if (res === "Ok") {
        // TODO: Set this to not change the location but update the channels correctly


        fetch(process.env.REACT_APP_API_URL + '/get_channels_in_group', { method: 'POST', credentials: 'include', body: JSON.stringify(this.props.group) })
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
      <Container fluid>
        <Row>

          {/**NAVIGATION BAR */}
          <Col xs={3} className="navbar">
            <Container>
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
              <Row className="max">
                <h1>{this.props.group}</h1>
              </Row>
              {this.renderChannels()}
              <Row>
                <Button onClick={() => { this.setState({ show: true }) }} variant="light">New Channel</Button>
              </Row></Container>


          </Col>



          {/**TEXT MESSAGE SECTION */}
          <Col>
            <p>Text Messages will go here</p>
          </Col>

        </Row>
      </Container>
    );
  }
}
