const InfluencerUser = require('../../models/InfluencerUser');

const bcrypt = require("bcrypt");
const {signToken} = require('../../helpers/signToken');


exports.login = async (req, res) => {
  const { email, password, remember } = req.body;

  try {
    let user = await InfluencerUser.findOne({email});
    if(!user) return res.status(404).json({msg: 'User not found'});

    const passCorrect = bcrypt.compareSync(password, user.password);
    if(!passCorrect) return res.status(401).json({msg: 'Email or password not valid' });

    const token = signToken(user, remember);
    res.status(200).json({
      token,
      user: {
        userId: user.id,
        email: user.email
      }
    })
  } catch (error) {
      console.log(error);
  }
}
