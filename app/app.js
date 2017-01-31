import {default as React, Component} from "react";
import {default as ReactDOM} from "react-dom";

/* backend for chat application */
const URI = 'https://adi-learn-react.herokuapp.com';

const socket = io(URI);

class Messages extends Component {
    constructor(props) {
        super(props);
    }

    render() {
      return (
            <ul className="media-list">
                <li className="media">
                  Message Content
                  <br />
                  <small className="text-muted"> Author | Date </small>
                </li>
            </ul>
      );
    }
}

class GroupChatList extends Component {
    constructor(props) {
        super(props);
    }

    render() {
      return (
            <div className="col-md-12">
                <a  className='list-group-item'>
                    <b>Group Chat Title</b>
                    <p className="text-right">Group Chat Author</p>
                </a>
            </div>
        );
    }
}


class GroupChatApp extends Component {
    constructor(props) {
        super(props);
        this.state = {}; /* TODO: what state do we need to track? */

        /* API calls */
        this.updateName = this.updateName.bind(this);
        this.updateChatInput = this.updateChatInput.bind(this);
        this.submitChatInput = this.submitChatInput.bind(this);
        this.submitChatInputOnEnter = this.submitChatInputOnEnter.bind(this);
        this.updateNewGroupName = this.updateNewGroupName.bind(this);
        this.submitNewGroupName = this.submitNewGroupName.bind(this);
        this.submitNewGroupNameOnEnter = this.submitNewGroupNameOnEnter.bind(this);
        this.updateGroupChat = this.updateGroupChat.bind(this);
    }

    /* Helper Functions */
    _sortChats(a,b) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    }
    
    _sortMessages(a,b) {
        return new Date(a.updatedAt) - new Date(b.updatedAt);
    }

    submitChatInputOnEnter(event) {
        if (event.keyCode === 13)  
            this.submitChatInput();
    }

    submitNewGroupNameOnEnter(event) {
        if (event.keyCode === 13) {
            this.submitNewGroupName();
        }
    }

    /* Called on first render */
    componentDidMount() {
      /* GET group chat list */
      fetch(URI+'/api/chat/').then((result) => {  /* get all group chats */
          result.json().then((json) => {
              json.chats.sort(this._sortChats);


              /* TODO: set state */
              

              /* then load first group chat by default */
              var firstGroupChatId = json.chats[0].id
              fetch(URI+'/api/chat/'+firstGroupChatId).then((result) => {
                  result.json().then((json) => {
                      json.messages.sort(this._sortMessages);


                      /* TODO: set state */
                      

                      socket.emit('join chat', /* TODO: what should we send? */);
                  });
              });
          });
      });

      /* socket.io callbacks */

      socket.on('message', (msg) => {

          /* TODO: set state */
      
      });

      socket.on('new chat', (chat) => {
          var newGroupChatList = this.state.groupChatList.slice(0)
          
          
          /* TODO: what do with new group chat? */

          
          newGroupChatList.sort(this._sortChats);
          
          
          /* TODO: set state */
          

          if (/* TODO: check state */)
              this.updateGroupChat(chat.chatID);
      });
    }

    /* Functions to manage state */
    updateName(event) {}
    updateNewGroupName(event) {}
    updateChatInput(event) {}


    /* API/socket.io calls. DO NOT TOUCH */
    submitChatInput(event) {
        if (this.state.body === '')
            alert('Cannot send empty message');

        if (this.state.body !== '') {
            fetch(URI+'/api/chat/'+this.state.chatID, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    body: this.state.body,
                    author: this.state.author || 'anonymous'
                })
            });

            socket.emit('message', {
                createdAt: new Date(),
                body: this.state.body,
                author: this.state.author,
                chatID: this.state.chatID
            });

            this.setState({
                body: ''
            });
        }
    }

    submitNewGroupName(event) {
        if (this.state.newGroupName == '')
            alert('Must choose chat name');

        if (this.state.newGroupName !== '') {
            
            fetch(URI+'/api/chat/', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: this.state.newGroupName,
                    author: this.state.author
                })
            }).then((result) => {
                result.json().then((json) => {
                    socket.emit('new chat', {
                        title: this.state.newGroupName,
                        author: this.state.author,
                        chatID: json.chatId,
                        updatedAt: new Date(json.updatedAt).toLocaleTimeString
                    });
                    this.setState({
                        chatID: json.chatId,
                        newGroupName: ''
                    });
                });                
            });
        }
    }

    updateGroupChat(id) {
        fetch(URI+'/api/chat/'+id).then((result) => {
            result.json().then((json) => {
                socket.emit('join chat', id);
                json.messages.sort(this._sortMessages)
                this.setState({
                    messages: json.messages || [],
                    chatID: id
                }); 
            });
        });
    }

    render() {
        return (
            <div id="wrapper" className="container-fluid">
                <div className="row">
                    <div className="col-md-3 chats-row-container">
                         <div className="row chats-row">
                            <input type="text" className="form-control" placeholder="Username" onChange={this.updateName}  />
                            <GroupChatList /*TODO: add attributes */ updatefn={this.updateGroupChat}/>
                        </div>
                         <div className="row current-chat-footer">
                            <div className="panel-footer">
                                <div className="input-group">
                                    <input type="text" className="form-control" onChange={this.updateNewGroupName} onKeyDown={this.submitNewGroupNameOnEnter} value={this.state.newGroupName} placeholder="Create new group" />
                                    <span className="input-group-btn">
                                        <button className="btn btn-default" type="button" onClick={this.submitNewGroupName}>Create</button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-9 current-chat">
                        <div className="row current-chat-area">
                            <div className="col-md-12">
                                <Messages /*TODO: add attributes */ />
                            </div>
                        </div>
                        <div className="row current-chat-footer">
                            <div className="panel-footer">
                                <div className="input-group">
                                    <input type="text" className="form-control" onChange={this.updateChatInput} onKeyDown={this.submitChatInputOnEnter} value={this.state.body} placeholder="Press enter to chat" />
                                    <span className="input-group-btn">
                                        <button className="btn btn-default" type="button" onClick={this.submitChatInput}>Send</button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


ReactDOM.render(
  <GroupChatApp />,
  document.getElementById('main')
);