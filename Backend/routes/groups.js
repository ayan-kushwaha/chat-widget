const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, emoji } = req.body;
        const orgId = req.user.organizationId; // Assuming orgId is attached to req.user

        const newGroup = new Group({
            organizationId: orgId,
            name,
            description,
            emoji,
            members: []
        });

        const savedGroup = await newGroup.save();
        res.json(savedGroup);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/groups
// @desc    Get all groups for the organization
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const groups = await Group.find({ organizationId: orgId }).sort({ createdAt: -1 });
        res.json(groups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/groups/:id
// @desc    Update group details
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description, emoji } = req.body;

        let group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        // Check ownership (Optional but recommended)
        if (group.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        group.name = name || group.name;
        group.description = description !== undefined ? description : group.description;
        group.emoji = emoji || group.emoji;
        group.updatedAt = Date.now();

        await group.save();
        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/groups/:id/members
// @desc    Add/Remove members (Batch operation)
// @access  Private
router.put('/:id/members', auth, async (req, res) => {
    try {
        const { memberIds, action } = req.body; // action: 'add' or 'remove'

        let group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (group.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (action === 'add') {
            // Add unique members
            const newMembers = memberIds.filter(id => !group.members.includes(id));
            group.members.push(...newMembers);
        } else if (action === 'remove') {
            group.members = group.members.filter(id => !memberIds.includes(id));
        }

        await group.save();
        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (group.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await group.deleteOne();
        res.json({ msg: 'Group removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
