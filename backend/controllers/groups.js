const Group = require("../models/Group");
const Message = require("../models/Message");
const User = require("../models/User");

/* CREATE GROUP */
const createGroup = async (req, res) => {
    try {
        const { name, description, type, userId } = req.body;
        const newGroup = new Group({
            name,
            description,
            type,
            members: [userId], // Creator is first member
        });
        const savedGroup = await newGroup.save();
        res.status(201).json(savedGroup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* GET ALL GROUPS */
const getGroups = async (req, res) => {
    try {
        const groups = await Group.find();
        res.status(200).json(groups);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

/* JOIN GROUP */
const joinGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const group = await Group.findById(id);

        if (!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();
        }

        const groups = await Group.find(); // Return all groups to update UI
        res.status(200).json(groups);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

/* GET MESSAGES */
const getGroupMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const messages = await Message.find({ groupId: id })
            .populate("userId", "firstName lastName picturePath")
            .sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

/* SEND MESSAGE */
const sendMessage = async (req, res) => {
    try {
        const { id } = req.params; // groupId
        const { userId, content } = req.body;

        const newMessage = new Message({
            groupId: id,
            userId,
            content,
        });
        await newMessage.save();

        const messages = await Message.find({ groupId: id })
            .populate("userId", "firstName lastName picturePath")
            .sort({ createdAt: 1 });

        res.status(201).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createGroup,
    getGroups,
    joinGroup,
    getGroupMessages,
    sendMessage,
};
