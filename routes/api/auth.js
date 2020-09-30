const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

// @route GET api/users
// @desc Get user information 
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch(err) {
        console.log(err);
        return res.status(500).send('Server Error');
    }
});

// @route    Post api/users
// @desc     Login user 
router.post('/', 
[
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please is required').exists()
], 
async (req, res) => {
    // check if user info is valid
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array() });
    }

    const { email, password } = req.body;
    // see if user exists
    try {
        let user = await User.findOne({ email: email });

        if (!user) {
            return res.status(400).json({ errors: [ {msg: 'Invalid Credentials'}]});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ errors: [ {msg: 'Invalid Credentials'}]}); 
        }
        
        // return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'), 
            {expiresIn: 36000}, 
            (err, token) => {
                if (err) throw err;
                res.json({ token });
        })

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    

});

module.exports = router;