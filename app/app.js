import {default as React, Component} from "react";
import {default as ReactDOM} from "react-dom";

const URI = 'https://adi-learn-react.herokuapp.com';

const socket = io(URI);

class Messages extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const messages = this.props.messages.map((msg) =>
            <li key={msg._id} className="media">
                {msg.body}
                <br />
                <small className="text-muted">{msg.author} | {(new Date(msg.createdAt)).toLocaleTimeString()}</small>
            </li>
        );
        return (
            <ul className="media-list">
                {messages}
            </ul>
        );
    }
}

class GroupChatList extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const groups = this.props.list.map((groupChat) => 
            <a  className={'list-group-item ' + (this.props.chatID == groupChat.id ? 'selected-chat-row' : '')} key={groupChat.id} onClick={() => this.props.updatefn(groupChat.id)}>
                <b>{groupChat.title}</b>
                <p className="text-right">{groupChat.author}</p>
            </a>
        );

        return (
            <div className="col-md-12">
                {groups}
            </div>
        );
    }
}

class GroupChatApp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            author: '',
            body: '',
            messages: [],
            groupChatList: [],
            chatID: 0,
            newGroupName: ''
        };

        this.updateName = this.updateName.bind(this);
        this.updateChatInput = this.updateChatInput.bind(this);
        this.submitChatInput = this.submitChatInput.bind(this);
        this.submitChatInputOnEnter = this.submitChatInputOnEnter.bind(this);
        this.updateNewGroupName = this.updateNewGroupName.bind(this);
        this.submitNewGroupName = this.submitNewGroupName.bind(this);
        this.submitNewGroupNameOnEnter = this.submitNewGroupNameOnEnter.bind(this);
        this.updateGroupChat = this.updateGroupChat.bind(this);
    }

    _sortChats(a,b) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    }

    _sortMessages(a,b) {
        return new Date(a.updatedAt) - new Date(b.updatedAt);
    }

    componentDidMount() {
        /* API GET for group chat list and log */
        fetch(URI+'/api/chat/').then((result) => { //get all group chats
            result.json().then((json) => {
                json.chats.sort(this._sortChats);
                this.setState({
                    groupChatList: json.chats || []
                });
                // then load first group chat by default
                var firstGroupChatId = json.chats[0].id
                fetch(URI+'/api/chat/'+firstGroupChatId).then((result) => {
                    result.json().then((json) => {
                        // console.log(json.messages);
                        json.messages.sort(this._sortMessages);
                        this.setState({
                            messages: json.messages || [],
                            chatID: firstGroupChatId || 0
                        })
                        socket.emit('join chat', this.state.chatID);
                    });
                });
            });
        });

        /* socket.io callbacks */
        socket.on('message', (msg) => {
            this.setState({
                messages: this.state.messages.concat([{author: msg.author, body: msg.body, createdAt: msg.createdAt}]),
            });
        });

        socket.on('new chat', (chat) => {
            console.log('received new chat ' + this.state.chatID);
            var newGroupChatList = this.state.groupChatList.slice(0)
            newGroupChatList.unshift({
                id: chat.chatID,
                author: chat.author,
                title: chat.title,
                updatedAt: chat.updatedAt
            });
            /* Sort by most recently updated */
            newGroupChatList.sort(this._sortChats);
            this.setState({
                groupChatList: newGroupChatList
            });
            if (this.state.chatID === chat.chatID)
                this.updateGroupChat(chat.chatID);
        });
    }

    updateName(event) {
        this.setState({
            author: event.target.value
        });
    }

    updateChatInput(event) {
        this.setState({
            body: event.target.value
        });
    }

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

    submitChatInputOnEnter(event) {
        console.log('out');
        if (event.keyCode === 13) {
            console.log('in');
            this.submitChatInput();
        }
    }

    updateNewGroupName(event) {
        this.setState({
            newGroupName: event.target.value
        });
    }

    submitNewGroupName(event) {
        if (this.state.newGroupName == '')
            alert('Must choose chat name');

        if (this.state.newGroupName !== '') {
            console.log('author is: ' + this.state.author);
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

                console.log('emitted event and posted');
            });
        }
    }

    submitNewGroupNameOnEnter(event) {
        if (event.keyCode === 13) {
            this.submitNewGroupName();
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
                            <input type="text" className="form-control" placeholder="Username" onChange={this.updateName} />
                            <GroupChatList chatID={this.state.chatID} list={this.state.groupChatList} updatefn={this.updateGroupChat}/>
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
                                <Messages messages={this.state.messages}/>
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


