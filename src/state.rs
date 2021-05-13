use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

pub struct State(Mutex<Groups>);

type Groups = HashMap<String, Group>;

type Group = HashMap<String, Channel>;

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

    pub fn add_user(&self, user: User, group: String, channel: String) {
        let mut groups = self.0.lock().unwrap();
        let group = if let Some(group) = groups.get_mut(&group) {
            group
        } else {
            groups.insert(group.clone(), HashMap::new());
            groups.get_mut(&group).unwrap()
        };
        let channel = if let Some(channel) = group.get_mut(&channel) {
            channel
        } else {
            group.insert(channel.clone(), HashMap::new());
            group.get_mut(&channel).unwrap()
        };
        channel.insert(user, Vec::new());
    }

    pub fn peers(&self, user: User, group: String, channel: String) -> Vec<User> {
        let groups = self.0.lock().unwrap();
        let group = groups.get(&group).unwrap();
        let channel = group.get(&channel).unwrap();
        channel.keys().cloned().filter(|&id| id != user).collect()
    }

    pub fn add_signal(&self, user: User, group: String, channel: String, signal: Signal) {
        let mut groups = self.0.lock().unwrap();
        let group = groups.get_mut(&group).unwrap();
        let channel = group.get_mut(&channel).unwrap();
        let signals = channel.get_mut(&user).unwrap();
        signals.push(signal);
    }

    pub fn take_signals(&self, user: User, group: String, channel: String) -> Vec<Signal> {
        let mut groups = self.0.lock().unwrap();
        let group = groups.get_mut(&group).unwrap();
        let channel = group.get_mut(&channel).unwrap();
        let signals = channel.get_mut(&user).unwrap();
        let new_signals = signals.clone();
        signals.clear();
        new_signals
    }

    pub fn remove_user(&self, user: User, group_name: String, channel_name: String) {
        let mut groups = self.0.lock().unwrap();
        let group = groups.get_mut(&group_name).unwrap();
        let channel = group.get_mut(&channel_name).unwrap();

        channel.remove(&user);

        if channel.is_empty() {
            group.remove(&channel_name);

            if group.is_empty() {
                groups.remove(&group_name);
            }
        }
    }
}
