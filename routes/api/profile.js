const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const request = require('request');
const config = require('config');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

// @route   GET api/profile/me
// @desc    get current user profile
// @access  private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })
        .populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for the user'});
        }

        return res.json(profile);
    } catch(err) {
        console.log('error')
        console.error(err.message);
        return res.status(500).send('Server Error')
    }
});

// @route   POST api/profile
// @desc    Create or update profile
// @access  private
router.post(
    '/', 
    [
        auth, 
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty()
        ]
    ], 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        company,
        location, 
        website,
        bio,
        skills,
        status,
        githubusername,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build social object
    profileFields.social = {}
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkedin) profileFields.social.linkedin = linkedin;
    if(instagram) profileFields.social.instagram = instagram;

    try{
        let profile = Profile.findOne({ user: req.user.id });


        // Update
        profile = await Profile.findOneAndUpdate(
            { user: req.user.id }, 
            { $set: profileFields },
            { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            
        return res.json(profile);
        

        // Create
        // profile = new Profile(profileFields);

        // await profile.save();
        // res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});


// @route   GET api/profile
// @desc    Get all profiles
// @access  public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles)
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

// @route   GET api/profile/user/:user_id
// @desc    Get profile by ID
// @access  public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id })
        .populate('user', ['name', 'avatar']);

        if (!profile) return res.status(400).json({ msg: 'Profile not found'})
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found'})
        }
        res.status(500).send('Server Error');
    }
})

// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private
router.delete('/', auth, (req, res) => {
    try {
        // remove user posts
        Post.deleteMany({ user: req.user.id })
        // Remove profile
        Profile.findOne({ user: req.user.id })
        .then(profile => profile.remove());

        // Remove user
        User.findById(req.user.id)
        .then(user => user.remove());

        res.json({ msg: 'User deleted' })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put('/experience', [auth, [
    check('title', 'title is required').not().isEmpty(),
    check('company', 'company is required').not().isEmpty(),
    check('from', 'from is required').not().isEmpty(),
]], 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    // Add profile experience
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE api/profile/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        // Remove experience
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('from', 'from is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty()
]], 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
       school,
       degree,
       from,
       fieldofstudy,
       to,
       current,
       description
    } = req.body

    const newEdu = {
        school,
        degree,
        from,
        fieldofstudy,
        to,
        current,
        description
    }

    // Add profile experience
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(newEdu);
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route   DELETE api/profile/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get remove index
        const removeIndex = profile.education
        .map(item => item.id)
        .indexOf(req.params.edu_id);

        // Remove education
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${
                req.params.username
            }/repos?per_pages=5&
            sort=created:asc&client_id=${
                config.get('githubClientId')
            }&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        }
        // ````````````````````
        request(options, (error, response, body) => {
            if(error) console.error(error);

            if(response.statusCode !== 200) {
                res.status(404).json({ msg: 'No Github profile found' });
            }

            res.json(JSON.parse(body));
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})
module.exports = router;