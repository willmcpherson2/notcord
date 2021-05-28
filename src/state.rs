use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

pub struct State(Mutex<Chats>);

type Chats = HashMap<ChannelId, Channel>;

#[derive(PartialEq, Eq, Hash, Clone, Deserialize)]
#[serde(untagged)]
pub enum ChannelId {
    Friends {
        user1: String,
        user2: String,
    },
    GroupAndChannel {
        channel_name: String,
        group_name: String,
    },
}

type Channel = HashMap<User, Signals>;

type Signals = Vec<Signal>;

#[derive(Clone, Deserialize, Serialize)]
pub struct Signal {
    pub signal: String,
    pub peer: User,
}

pub type User = i64;

impl State {
    pub fn new() -> Self {
        Self(Mutex::new(HashMap::new()))
    }

    pub fn add_user(&self, user: User, channel_id: ChannelId) {
        let chats = &mut self.0.lock().unwrap();

        let channel = if let Some(channel) = chats.get_mut(&channel_id) {
            channel
        } else {
            chats.insert(channel_id.clone(), HashMap::new());
            chats.get_mut(&channel_id).unwrap()
        };

        channel.insert(user, Vec::new());
    }

    pub fn peers(&self, user: User, channel_id: ChannelId) -> Option<Vec<User>> {
        let chats = self.0.lock().unwrap();
        let channel = chats.get(&channel_id)?;
        let peers = channel.keys().cloned().filter(|&id| id != user).collect();
        Some(peers)
    }

    pub fn add_signal(&self, user: User, channel_id: ChannelId, signal: Signal) -> Option<()> {
        let mut chats = self.0.lock().unwrap();
        let channel = chats.get_mut(&channel_id)?;
        let signals = channel.get_mut(&user)?;
        signals.push(signal);
        Some(())
    }

    pub fn take_signals(&self, user: User, channel_id: ChannelId) -> Option<Vec<Signal>> {
        let mut chats = self.0.lock().unwrap();
        let channel = chats.get_mut(&channel_id)?;
        let signals = channel.get_mut(&user)?;
        let new_signals = signals.clone();
        signals.clear();
        Some(new_signals)
    }

    pub fn remove_user(&self, user: User, channel_id: ChannelId) -> Option<()> {
        let mut chats = self.0.lock().unwrap();
        let channel = chats.get_mut(&channel_id)?;

        channel.remove(&user);

        if channel.is_empty() {
            chats.remove(&channel_id);
        }

        Some(())
    }

    pub fn users_in_voice(&self, channel_id: ChannelId) -> Option<Vec<User>> {
        let chats = self.0.lock().unwrap();
        let channel = chats.get(&channel_id)?;
        let users = channel.keys().cloned().collect();
        Some(users)
    }
}
