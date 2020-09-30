const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route POST api/users
// @desc Register user
router.post('/', 
[
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a pssword with 6 or more characters').isLength({min: 6})
], 
async (req, res) => {
    // check if user info is valid
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array() });
    }

    const { email, name, password } = req.body;
    // see if user exists
    try {
        let user = await User.findOne({ email: email });

        if (user) {
            return res.status(400).json({ errors: [ {msg: 'User already exits'}]});
        }

        // get users avatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        });

        // encrypt password
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

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